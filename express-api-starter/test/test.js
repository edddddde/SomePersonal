let a = async() => {
    await new Promise(r => {while(true){r()}})
}
(async() => {
   a();
   console.log("test");
})()