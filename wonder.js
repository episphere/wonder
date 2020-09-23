console.log('wonder.js loaded')

wonder={}


wonder.parserDiv=(div='wonderDivParser')=>{
    if(typeof(div)=='string'){
        div = document.getElementById(div)
    }
    div = div||document.createElement('div')
    let h = `<div><p>Read file(s), drag&drop supported:<br>Upload <input type="file" id="loadFiles" multiple></p><p>or from URL: <input id="inputWonderURL" size=50><button id="loadURLbutton" onclick="wonder.loadFromURL()">load</button><span onclick="window.open(inputWonderURL.value)" style="cursor:pointer;cursor:green">&#8599;</span>`
    h += `<br><button onclick="wonder.demo(1)" style="font-size:small">1999-2018 D91F042</button><button onclick="wonder.demo(2)" style="font-size:small">1999-2018 D91F044</button><button onclick="wonder.demo(3)" style="font-size:small">1999-2018 D91F045</button><button onclick="wonder.demo(4)" style="font-size:small">Place of death jan-july 2015-2018 by state</button></p></div>`
    h+='<div id="wonderDataDiv"></div>'
    div.innerHTML=h
    loadFiles.onchange=evt=>{
        for(let i=0 ; i<loadFiles.files.length ; i++){
            let fr=new FileReader(); 
            fr.onload=function(){
                wonder.parseTxt(this.result,loadFiles.files[i].name,loadFiles.files[i].lastModifiedDate) 
            }
            fr.readAsText(loadFiles.files[i]);
        }
    }
    return div
}

wonder.loadFromURL=async(url)=>{
    url=url||inputWonderURL.value // default picked from input with id inputWonderURL
    let txt = await (await fetch(url)).text()
    wonder.parseTxt(txt,url)
}

wonder.demo=i=>{
    let urls=[
        'Underlying Cause of Death, 1999-2018 D91F042.txt',
        'Underlying Cause of Death, 1999-2018 D91F044.txt',
        'Underlying Cause of Death, 1999-2018 D91F045.txt',
        'Place of death jan-july 2015-2018 by state.txt'
    ]
    let url=urls[i-1]
    inputWonderURL.value='https://episphere.github.io/wonder/'+url
    loadURLbutton.click()
}

wonder.parseTxt=(txt,fname,lastModifiedDate,div0=document.getElementById('wonderDataDiv'))=>{
    if(typeof(txt)=='object'){
        txt=txt.result
    }
    lastModifiedDate=lastModifiedDate||new Date(Date.now())
    let y = {fname:fname,txt:txt,lastModifiedDate:lastModifiedDate}
    //console.log(y)
    //
    // assemble results array structure here
    wonder.data=wonder.data||[]
    //let y={}
    // parsing
    let rr = txt.split(/[\n\r]+/g) // rows
    rr=rr.map(r=>r.split(/\t/).map(v=>{
        //console.log(v)
        try{
            v=JSON.parse(v)
        } catch(err){}
        return v
    }))
    let sep=[] // block separators
    rr.forEach((r,i)=>{
        if(r[0]=="---"){
            sep.push(i)
        }
    })
    // extract 1st block, the table
    //y.rr=rr
    let rr1 = rr.slice(0,sep[1])
    let tb=[]
    let parms=rr1[0]
    rr1.slice(1).forEach((r,i)=>{
        let x={}
        parms.forEach((p,j)=>{
            x[p]=r[j]
        })
        tb[i]=x
    })
    y.dt=tb
    y.sep=sep
    wonder.data.push(y)
    if(div0){ // if a division is defined for visualization
        let div=document.createElement('div')
        //div.innerHTML='...'
        div0.prepend(div)
        wonder.showData(div,y)
    }
    // html parsing returned as a function so it is missed by JSON stringify
    y.queryHTML=_=>{return rr.slice(sep[0]+1,sep[1]).join('<br>')}
    y.infoHTML=_=>{return rr.slice(sep[1]+1).filter(x=>x[0]!="---").join('<br>')}
    //sep.push(rr.length)
    //debugger
    /*
    sep.slice(0,-1).forEach((s,i)=>{
    	let rs=rr.slice(s+1,sep[i+1]) // rows in this set
    	let p0=null
    	let p1=null
    	let fun = function(){
    		if(rs.length>0){ // while there are elements in the array
    			let x=rs.shift(1)[0]
    			console.log(x)
    			//if(x.match(/^[^\:]+/)){ // is there a parameter
    			if(x.match(/^[^0-9]+\:/)){ // is there a parameter
    			    if(x.slice(-1)==":"){ // is a supra parameter
    			    	p0=x.slice(0,-1)
    			    	y.meta[p0]={}
    			    	let x1=rs.shift(1)[0]
    			    	if(x1.match(/^[^0-9]+\:/)){
    			    		p1=x1.match(/^[^\:]+/)[0] // sub-parameter
							y.meta[p0][p1]=x1.match(/\:([^\:]+)$/)[1]
    			    	}else{
    			    		if(typeof(y.meta[p0])=='object'){
    			    			y.meta[p0]=''
    			    		}
    			    		y.meta[p0]+=x1
    			    	}
							
    			    }else{
    			    	if(p1){
    			    		p1=x.match(/^[^\:]+/)[0] // sub-parameter
							y.meta[p0][p1]=x.match(/\:([^\:]+)$/)[1]
    			    	}else{
    			    		p0=x.match(/^[^\:]+/)[0]
							y.meta[p0]=x.match(/\:([^\:]+)$/)[1]
    			    	}
    			    }
				}else{
					if(p1){
						y.meta[p0][p1]+=x
					}else{
						y.meta[p0]+=x
					}
				}
    			//debugger
    			fun()
    		}else{
    			return rs
    		}
    	}
    	fun()
    	//console.log(i,rs)
    	//debugger
    })
    */
    return y
}

wonder.saveFile=function(x,fileName) { // x is the content of the file
	var bb = new Blob([x]);
   	var url = URL.createObjectURL(bb);
	var a = document.createElement('a');
   	a.href=url;
	if (fileName){
		if(typeof(fileName)=="string"){ // otherwise this is just a boolean toggle or something of the sort
			a.download=fileName;
		}
		a.click() // then download it automatically 
	} 
	return a
}

wonder.saveJson=i=>{
    let data = wonder.data[i-1]
    wonder.saveFile(JSON.stringify(data),data.fname.match(/([^\/]+)\.[^\/]+$/)[1]+'.json')
}

wonder.saveCsv=i=>{
    let data = wonder.data[i-1]
    wonder.saveFile(data.txt.slice(0,data.txt.match(/"---"/).index).replace(/\t/g,','),data.fname.match(/([^\/]+)\.[^\/]+$/)[1]+'.csv')
}

wonder.showQuery=i=>{
	let divs = document.querySelectorAll('#showButtonSelection')
	let divi = divs[divs.length-i]
	let h = ''
	if(!divi.textContent.match(/^Dataset\:/)){
		h = wonder.data[i-1].queryHTML()
	}
	divi.innerHTML=h
}

wonder.showInfo=i=>{
	let divs = document.querySelectorAll('#showButtonSelection')
	let divi = divs[divs.length-i]
	let h = ''
	if(!divi.textContent.match(/^Help\:/)){
		h = wonder.data[i-1].infoHTML()
	}
	divi.innerHTML=h
}

wonder.showTable=i=>{
	let divs = document.querySelectorAll('#showButtonSelection')
	let divi = divs[divs.length-i]
	if(!divi.textContent.match(/^\(tabulation/)){
		divi.innerHTML='(tabulation of same data exportable as csv above)'
		divi.appendChild(wonder.htmlTable(wonder.data[i-1]))
	}else{
		divi.innerHTML=''
	}
	return divi
}

wonder.htmlTable=(data)=>{
    let dt = data.dt.slice(0,data.sep[0]) // only the table
	let div = document.createElement('div')
	div.style.color="navy"
	let cols = Object.keys(dt[0])
	let parms = cols.filter(c=>typeof(dt[0][c])=='string')
	let vals = cols.filter(c=>typeof(dt[0][c])=='number')
	div.innerHTML=`Rows: <select id="selRow"></select> Cols: <select id="selCol"></select> Values: <select id="selVal"></select><button onclick="wonder.copyTable(this)">copy</button><div id="tableDiv"></div>`
	let selRow = div.querySelector('#selRow')
	let selCol = div.querySelector('#selCol')
	let selVal = div.querySelector('#selVal')
	parms.forEach(p=>{
		let optRow = document.createElement('option')
		let optCol = document.createElement('option')
		optRow.value=optCol.value=optRow.textContent=optCol.textContent=p
		selRow.appendChild(optRow)
		selCol.appendChild(optCol)
	})
	vals.forEach(v=>{
		let optVal = document.createElement('option')
		optVal.value=optVal.textContent=v
		selVal.appendChild(optVal)
	})
	if(data.selRow){ // if values kept from last time
		selRow.value=data.selRow
		selCol.value=data.selCol
		selVal.value=data.selVal
	}
	selRow.onchange=selCol.onchange=selVal.onchange=(ev)=>{
		dv = div.querySelector('#tableDiv')
		rowParms = new Set([...dt.map(d=>d[selRow.value])])
		colParms = new Set([...dt.map(d=>d[selCol.value])])
		//console.log(rowParms,colParms,selVal.value)
		// tabulate
		h='<table>'
		// header
		h+=`<tr><th>[${selVal.value}]</th>`
		colParms.forEach(c=>{
			h+=`<th>${c}</th>`
		})
		h+='</tr>'
		// each row
		rowParms.forEach(r=>{
			h+=`<tr><th style="text-align:right">${r}</th>`
			colParms.forEach(c=>{
				let k = 0
				dt.filter(d=>(d[selRow.value]==r&d[selCol.value]==c)).forEach(x=>{
					let ki=x[selVal.value]
					if(typeof(ki)=='number'){
						k+=ki
					}
			    })
				h+=`<td style="color:blue;text-align:center">${k}</td>`
			})
			h += '</tr>'
		})
		h+='</table>'
		// keeping current selections for next run
		data.selRow=selRow.value
		data.selCol=selCol.value
		data.selVal=selVal.value
		dv.innerHTML=h
	}
	selRow.onchange()
		

	return div
}

wonder.copyTable=(tb)=>{ // copy table in the parent  to clipboard
    if(tb.tagName=="BUTTON"){
    	let bt = tb
    	bt.textContent="table copied"
    	setTimeout(_=>{
    		bt.textContent="copy"
    	},1000)
    	tb=bt.parentElement.querySelector('table')
    }
	// convert th into td
	let h = tb.innerHTML
	h = h.replace(/\<tbody\>/g,'').replace('</tbody>','').replace(/\<th[^>]*\>/g,'<td>').replace(/<\/th>/g,'</td>').replace(/\<td[^>]*\>/g,'<td>').replace(/<\/td><td>/g,'\t').replace(/<\/tr><tr>/g,'\r\n').replace(/<[\/]*tr>/g,'').replace(/<[\/]*td>/g,'').replace(/<[\/]*table>/g,'')
	let ta = document.createElement('textarea')
	document.body.appendChild(ta)
	ta.value = h
	ta.select()
	document.execCommand("copy")
	ta.parentElement.removeChild(ta)
}


wonder.showData=(div,data)=>{
    let i = div.parentElement.childElementCount
    let h =`<hr>` // clear div
    h += `<h3>${i}. ${data.fname}</h3>`
    h += `<li><b>Last modified:</b> ${data.lastModifiedDate}</li>`
    h += `<li><b>Fields (${Object.keys(data.dt[0]).length}):</b> ${Object.keys(data.dt[0]).join(',')}</li>`
    h += `<li><b>Export (${data.dt.length}):</b> <button onclick="wonder.saveJson(${i})">JSON</button> <button onclick="wonder.saveCsv(${i})">CSV</button></li>`
    h += `<li><b>Show:</b> <button id="showTableButton" onclick="wonder.showTable(${i})">Table</button> <button onclick="wonder.showQuery(${i})">Query</button> <button onclick="wonder.showInfo(${i})">Info</button></li>`
    h += `<div id="showButtonSelection" style="font-size:small;color:green"></div>`
    div.innerHTML=h
    return div
}

if(typeof(define)!='undefined'){
    define(wonder)
}