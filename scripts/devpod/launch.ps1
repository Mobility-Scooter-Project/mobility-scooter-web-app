$ID = "$($env:COMPUTERNAME)-mswa"
devpod up . --id $ID.ToLower()