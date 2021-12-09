package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	mainFileServer := http.FileServer(http.Dir("../public/dist"))

	r := mux.NewRouter()
	r.HandleFunc("/", mainFileServer)

	testFileServer := http.FileServer(http.Dir("../public/dist/test.html"))
	http.Handle("/test", testFileServer)

	http.Handle("/", mainFileServer)

	http.HandleFunc("/", helloHandler)

	var port string = ":5000"
	fmt.Println("Starting server at port", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}

}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/hello" {
		// http.Error(w, "404 not found.", http.StatusNotFound)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method is not supported.", http.StatusNotFound)
		return
	}

	fmt.Fprintf(w, "Hello!")
}
