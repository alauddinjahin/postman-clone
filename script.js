import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import prettyBytes from "pretty-bytes";
import setupEditors from "./setupEditor";




const d = document;

const form                      = d.querySelector(`[data-form]`);
const queryParamsContainer      = d.querySelector(`[data-query-params]`);
const requestHeadersContainer   = d.querySelector(`[data-request-headers]`);
const responseHeadersContainer  = d.querySelector(`[data-response-headers]`);
const keyValueTemplate          = d.querySelector(`[data-key-value-template]`);

d.querySelector(`[data-add-query-param-btn]`).addEventListener('click',(e)=>{
    queryParamsContainer.append(createKeyValuePair());
});

d.querySelector(`[data-add-request-header-btn]`).addEventListener('click',(e)=>{
    requestHeadersContainer.append(createKeyValuePair());
});


queryParamsContainer.append(createKeyValuePair());
requestHeadersContainer.append(createKeyValuePair());


// custom headers 

axios.interceptors.request.use(request=>{
    request.customData = request.customData || {};
    request.customData.startTime = new Date().getTime();
    return request;
})


axios.interceptors.response.use(updateEndTime, e =>{
    return Promise.reject(updateEndTime(e.response));
})


function updateEndTime(response){
    response.customData = response.customData || {};
    response.customData.time = new Date().getTime() - response.config.customData.startTime;
    return response;
}


const {requestEditor, updateResponseEditor} = setupEditors();


form.addEventListener('submit',(e)=>{
    e.preventDefault();

    let data;
    try{
        data = JSON.parse(requestEditor.state.doc.toString() || null);
    }catch(error){
        console.log(`JSON data is malformed`);
        return;
    }

    axios({
        url     :   d.querySelector(`[data-url]`).value,
        method  :   d.querySelector(`[data-method]`).value,
        params  :   keyValuePairsToObjects(queryParamsContainer),
        headers :   keyValuePairsToObjects(requestHeadersContainer),
        data
    })
    .catch(err => err)
    .then(response => {
        d.querySelector(`[data-response-section]`).classList.remove("d-none");
        updateResponseDetails(response);
        updateResponseEditor(response.data);
        updateResponseHeaders(response.headers);
    });
});



function createKeyValuePair(){
    const element = keyValueTemplate.content.cloneNode(true);
    element.querySelector(`[data-remove-btn]`).addEventListener('click',(e)=>{
        e.target.closest(`[data-key-value-pair]`).remove();
    });

    return element;
}


function keyValuePairsToObjects(container){

    const pairs = container.querySelectorAll(`[data-key-value-pair]`);
    return [... pairs].reduce((data, pair)=>{
        const key   = pair.querySelector(`[data-key]`).value;
        const value = pair.querySelector(`[data-value]`).value;

        if(key === '') return data;
        return {...data, [key]:value };

    },{})

}


function updateResponseDetails(response){
    d.querySelector(`[data-status]`).textContent=response.status;
    d.querySelector(`[data-time]`).textContent=response.customData.time;
    d.querySelector(`[data-size]`).textContent=prettyBytes(
        JSON.stringify(response.data).length + 
        JSON.stringify(response.headers).length
    );

}


function updateResponseHeaders(headers){
    responseHeadersContainer.innerHTML="";
    Object.entries(headers).forEach(([key,value])=>{
        const keyElement = d.createElement("div");
        keyElement.textContent=key;
        responseHeadersContainer.append(keyElement);

        const valueElement = d.createElement("div");
        valueElement.textContent=value;
        responseHeadersContainer.append(valueElement);
    });

}


//  package module installed 
//  npm i @codemirror/commands @codemirror/view @codemirror/basic-setup @codemirror/lang-json 
//  npm i pretty-bytes 


