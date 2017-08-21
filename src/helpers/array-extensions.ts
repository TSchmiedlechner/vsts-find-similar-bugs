interface Array<T> {
    createChunks(chunkSize: number): Array<Array<T>>;
 }
 
 Array.prototype.createChunks = function (chunkSize) {

    let chunks : any[][];
    for (let i = 0; i < this.length; i += this.chunkSize) {
        chunks.push(this.slice(i, i + this.chunkSize));
    }
    return chunks;
 }