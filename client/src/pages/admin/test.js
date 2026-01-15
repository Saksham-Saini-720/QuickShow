

function setInter(){
  console.log("ramesh")
  setTimeout(function() {
    setInter()
  }, 2000);  
}

setInter()

