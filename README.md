# JQuery-Ajax-Uploader

This lightweight JQuery plugin enables a basic Ajax file uploading feature on the frontend side. It is supposed to work well with any Laravel backend.  

## 1. Requirements

You must load JQuery before using this plugin. 

You should make sure that the page html layout has the following ```<meta>``` tag:  
```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

Otherwise, the request may be blocked by Laravel by default. See more details at https://laravel.com/docs/5.8/csrf#csrf-x-csrf-token.  

The plugin automatically checks the existence of this ```<meta>``` tag, get its content and associate ```X-CSRF-TOKEN``` header with the uploading request.  
 
Alternatively, ***if and only if*** this ```<meta>``` tag does not exist (maybe you do not want to use, or for somewhat reasons), then you can include ```X-CSRF-TOKEN``` request header before sending files to server via ```beforeSend(xhr)``` hook as follows:  

```javascript
$(document).ready(function () {
    $('#image-upload').bkstar123_ajaxuploader({
        ...
        beforeSend: (xhr) => {
            xhr.setRequestHeader('X-CSRF-TOKEN', {!! json_encode(csrf_token()) !!});
        },
        ...
    });
});
```

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
<script src="/path/to/bkstar123-ajax-uploader.min.js"></script> // This minified JS file can be found at node_modules/@bkstar18/jquery-ajax-uploader/dist/ path
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
    progressBarColor: 'bg-primary', // set the color of the progress bar, see https://getbootstrap.com/docs/4.3/components/progress/
}
```

All these default settings can be overwritten by the ```settings``` argument that you pass to ```bkstar123_ajaxuploader()```.  

**Important Note**:  
The plugin expects to receive JSON response from the backend with ```success``` key in case of success or ```error``` key in case of error.  

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
The plugin will automatically wrap the selected ```<input type="file" />```  element in a outer element ```<div class="bkstar123-ajaxuploader-container-image-upload" id="bkstar123-ajaxuploader-container-image-upload">```  

Where ```bkstar123-ajaxuploader``` is a prefix that you can change by ```prefix``` key in the ```settings``` argument.  

You can also add more class to the wrapping element by ```outerClass``` key in the ```settings``` argument.  

There are two callback hooks that you can use, that are, ```beforeSend(xhr)``` and ```onResponse(respomse)```:  

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
        if (res.data) {
            $('#gallery').append(`<img id="${res.data.filename}" src="${res.data.url}" width="50px">`);
        }
    }
});
```

## 4. Demo

This section will demonstrate how to build a completed system (both backend & frontend) for handling Ajax file upload.  

**Backend**:
- Built from a new & clean Laravel application with the use of ***bkstar123/laravel-uploader*** package (written by myself)  
(See its full documentation at https://github.com/bkstar123/laravel-uploader)     

**Frontend**:
- Built with this JQuery plugin ***@bkstar18/jquery-ajax-uploader***, of course :-)  

### 4.1 Preparation

**a) Create a new Laravel application**   
```laravel new testproject```  

**b) Create a symlink between ```public/storage``` and ```storage/app/public```**  
```cd testproject & php artisan storage:link```  

**c) Create a photos migration**  
```php artisan make:migration create_photos_table --table```

Place the following lines in the ```up()``` function:  
```php
<?php
...
Schema::create('photos', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('filename');
    $table->string('path');
    $table->string('url');
    $table->string('disk');
    $table->timestamps();
});
...
```  

**d) Create ```App\Photo``` model**  
```php artisan make:model Photo```  

Place the following lines:  
```php
<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    protected $fillable = [
        'filename', 'url', 'path', 'disk'
    ];
}
```

**e) Run migration**    
```php artisan migration```  

**Note**: Of course, you must configure the database connection in ```.env```

**f) Create upload routes**  
In ```routes/web.php```, place the following routes:  

```php
Route::get('/upload', 'UploadController@showUploadForm');
Route::post('/api/upload', 'UploadController@upload');
```

**g) Create controller**  
```php artisan make:controller UploadController```  

**h) Scaffolding your application**    
```php artisan make:auth```

The purpose of scaffolding is just to quickly generate the master layout and other basic views for your application. 

**i) Install npm packages**  
```npm install``` 

### 4.2 Integrate bkstar123/laravel-uploader package to backend

**a) Install bkstar123/laravel-uploader package**  
```composer require bkstar123/laravel-uploader```  

**b) Install @bkstar18/jquery-ajax-uploader plugin**  
```npm install --save-dev @bkstar18/jquery-ajax-uploader```

**c) Bundle the plugin into the main app.js**  
- Place the following line in the ```resources/js/bootstrap.js```
```javascript
try {
    window.Popper = require('popper.js').default;
    window.$ = window.jQuery = require('jquery');

    require('bootstrap');
    require('@bkstar18/jquery-ajax-uploader'); // Add this line
} catch (e) {}
```

- Compile frontend assets  
```npm run dev```  or ```npm run production```  

**d) In ```UploadController```**  
```php
<?php
namespace App\Http\Controllers;

use App\Photo;
use Illuminate\Http\Request;
use Bkstar123\LaravelUploader\Contracts\FileUpload;

class UploadController extends Controller
{
    public function showUploadForm()
    {
        return view('upload');
    }

    public function upload(Request $request, FileUpload $fileupload)
    {
        $data = $fileupload->handle($request, 'image', ['allowedExtensions' => ['jpg', 'png', 'jpeg']]);
        if (!$data) {
            return response()->json(['error' => $fileupload->uploadError], 422);
        }

        Photo::create($data);
        return response()->json(['success' => "{$data['filename']} has been successfully uploaded", 'data' => $data], 200);
    }
}
```

**e) In ```resources/views/upload.blade.php```**  

Place the following code:  
```html
@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">Upload</div>

                <div class="card-body">
                    @if (session('status'))
                        <div class="alert alert-success" role="alert">
                            {{ session('status') }}
                        </div>
                    @endif

                    <div class="form-group">
                        <label for="video">Upload Images</label>
                        <input type="file" class="form-control" name="image" id="image-upload" multiple>
                        <div class="gallery" id="gallery"></div>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('js')
<script type="text/javascript">
$(document).ready(function () {
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
            if (res.data) {
                $('#gallery').append(`<img id="${res.data.filename}" src="${res.data.url}" width="50px">`);
            }
        }
    });
});
</script>
@endpush
```

**Note:** In ```resources/views/layouts/app.blade.php```, you may need to remove ```defer``` from  
```html
<!-- Scripts -->
<script src="{{ asset('js/app.js') }}" defer></script> <!-- remmove this 'defer' -->
```  

and add ```@stack('js')``` before the closing body tag ```</body>```.  

***--DONE--***