package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	socketio "github.com/googollee/go-socket.io"
	"github.com/gorilla/mux"
)

type indexHandler struct {
	staticPath string
	indexPath  string
}

func (h indexHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	encryption := readEncryption()

	path, err := filepath.Abs(r.URL.Path)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	path = filepath.Join(h.staticPath, h.indexPath)

	for enc, fn := range *encryption {
		if strings.Compare("/"+enc, r.URL.String()) == 0 {
			path = filepath.Join(h.staticPath, "models", fn)

			http.ServeFile(w, r, path)
			return
		}
	}

	if !strings.Contains(r.URL.String(), ".html") && strings.Contains(r.URL.String(), ".") {
		path = filepath.Join(h.staticPath, r.URL.String())
		http.ServeFile(w, r, path)
		return
	}

	// fmt.Printf("path:\t", path)
	// check whether a file exists at the given path
	_, err = os.Stat(path)
	if os.IsNotExist(err) {
		// file does not exist, serve index.html
		fmt.Println("File does not exist", path)
		http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		return
	} else if err != nil {
		// if we got an error (that wasn't that the file doesn't exist) stating the
		// file, return a 500 internal server error and stop
		fmt.Println("Other error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.ServeFile(w, r, path)
}

type KeyValue map[string]string

func readEncryption() *map[string]string {
	encrytionFile, err := os.Open("./public/src/shared-backend/encryption.json")
	if err != nil {
		fmt.Println(err)
	}

	byteValue, _ := ioutil.ReadAll(encrytionFile)

	m := &map[string]string{}

	_ = json.Unmarshal(byteValue, m)

	return m
}

func main() {

	r := mux.NewRouter()

	server := socketio.NewServer(nil)

	server.OnConnect("/socket.io/", func(s socketio.Conn) error {
		s.SetContext("")

		fmt.Println("connected socketio:", s.ID())
		s.Emit("connect")
		return nil
	})

	server.OnEvent("/", "connect", func(s socketio.Conn, msg string) {
		fmt.Println("notice:", msg)
		s.Emit("reply", "have "+msg)
	})

	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		fmt.Println("connected:", s.ID())
		return nil
	})

	server.OnError("/", func(s socketio.Conn, e error) {
		fmt.Println("meet error:", e)
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		fmt.Println("closed", reason)
	})

	go server.Serve()
	defer server.Close()
	r.Handle("/socket.io/", server)

	test := indexHandler{staticPath: "./public/dist", indexPath: "test.html"}
	r.Path("/test").Handler(test)

	index := indexHandler{staticPath: "./public/dist", indexPath: "index.html"}
	r.PathPrefix("/").Handler(index)

	srv := &http.Server{
		Handler: r,
		Addr:    "localhost:5000",
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())

}

func catchAllHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method is not supported.", http.StatusNotFound)
		return
	}
}
