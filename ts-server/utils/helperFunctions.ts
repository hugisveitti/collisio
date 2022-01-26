import * as  si from 'systeminformation';

si.cpu()
    .then(data => {
        console.log("####CPU Info#####")
        console.log("cores", data.cores)
        console.log("#####END CPU INFO#####")
    })
    .catch(error => console.error(error));

export const byteToGig = (byte: number) => {
    return byte / (1024 ** 3)
}

export const printMemoryInfo = () => {

    si.mem()
        .then(data => {
            console.log("#### Memory Info #####", new Date().toISOString())
            console.log("Total", byteToGig(data.total).toFixed(2), ", Free:", byteToGig(data.free).toFixed(2))
            console.log("##### END Memory INFO #####")
        })
        .catch(error => console.error(error));
}
