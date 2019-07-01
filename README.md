# JQuery-Ajax-Uploader

This JQuery plugin enables a basic Ajax file uploading feature on the frontend side. It is supposed to work well with any Laravel backend.  

## 1. Requirements

You must load JQuery before using this plugin.  

## 2. Installation

    npm install @bkstar18/jquery-ajax-uploader

## 3. Usage

**In HTML section**:  
Insert a normal file input tag as follows:  
```html
<!-- use 'multiple' if you want to allow multiple files selection -->
<input type="file" class="form-control" name="image" id="image-upload" multiple>
```

**In Javascript section**:  
```javascript
// JQuery must be loaded before this section
<script src="path/to/node_modules/@bkstar18/jquery-ajax-uploader/dist/bkstar123-ajax-uploader.min.js"></script>
<script type="text/javascript">
$(document).ready(function () {
    $('#image-upload').bkstar123_ajaxuploader(settings);
});
</script>
```

Passing ```settings``` to ```bkstar123_ajaxuploader()``` is optional. If you do not pass any argument, then the plugin will use its defaults as follows:  

```javascript
defaults = {
	size: 5242880, // In bytes <=> 5MB
    uploadUrl: '/upload', // Backend URL to upload file
    batchSize: 5, // Maximum number of files that can be uploaded in parallel
    allowedExtensions: ['png', 'jpg', 'jpeg', 'mp4', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'pdf'], // Accepted file extensions
}
```

All these default settings can be overwritten by the ```settings``` argument that you pass to ```bkstar123_ajaxuploader()```.  

**Important Note**:  
The plugim expects to receive JSON response from the backend with ```success``` key in case of success or ```error``` key in case of error.  

Sample structure of JSON responses are as follows:  
***a) Success response***  
```javascript
{
    "success": "Successfully uploaded", // mandatory key
    ...  // other key that you may add
}
```

***b) Error response***
```javascript
{
    "error": "Upload failed", // mandatory key
    ...  // other key that you may add
}
```

**Advanced use**:  
The plugin will automatically wrap the selected ```<input type="file" />```  element in a outer element ```<div class="bkstar123-ajaxuploader-container-image-upload col-md-12" id="bkstar123-ajaxuploader-container-image-upload col-md-12">```  

Where ```bkstar123-ajaxuploader``` is a prefix that you can change by ```prefix``` key in the ```settings``` argument.  

You can also add more class to the wrapping element by ```outerClass``` key in the ```settings``` argument.  

There are two callback hook that you can use, that are, ```beforeSend(xhr)``` and ```onResponse(respomse)```:  

- ```beforeSend(xhr)``` hook is called right before sending files to the server, and it is passed with the whole XmlHttpRequest object. You can use this hook to modify the behavior of XHR object before it start sending files to the server, for example to add more request header like ```xhr.setRequestHeader(header, value)```.  

- ```onResponse(response)``` hook is called when the uploading process is completed (xhr.readystate = 4, no matter success or failure). It is passed with the whole server response.  

**Example**:  
```javascript
$('#image-upload').bkstar123_ajaxuploader({
    allowedExtensions: ['png','jpg','jpeg'],
    batchSize: 5,
    outerClass: 'col-md-12',
    uploadUrl: '/api/upload',
    beforeSend: (xhr) => {
        xhr.setRequestHeader('X-AUTHOR', 'TUANHA');
    },
    onResponse: (response) => {
        let res = JSON.parse(response)
        $('#gallery').append(`<img id=${res.data.filename} src="${res.data.url}" width="50px">`);
    }
});
```