let data;

function readFile(event) {
    data = event.target.result
    console.log(data);

    if(isValidData(data)){
        
    }else {
        console.error("Invalid DATA")
    }

}

function changeFile() {
  var file = document.getElementById("inputFile").files[0];
  var reader = new FileReader();
  reader.addEventListener('load', readFile);
  //reader.readAsText(file);
  reader.readAsArrayBuffer(file)
}

function isValidData(data) {
    //return data.substr(0, 4) == 'VOX '
}