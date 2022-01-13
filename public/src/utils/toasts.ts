import { toast } from "react-toastify"

const toasts = {}

const createToast = (type: "succsess" | "warning" | "error", text: string, id: string) => {

    if (id in toasts) {
        console.warn("Toast already exists!")
    }
    toast[id] = true

    toast[type](text, {
        onClose: () => {
            delete toast[id]
        }
    })
}