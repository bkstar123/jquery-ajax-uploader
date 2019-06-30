/*!
 * jQuery bkstar123-ajaxuploader plugin
 * author: tuanha
 * last-mod: 2019-06-30
 * Licensed under the MIT license
 */
;
(function($, window, document, undefined) {

    var pluginName = 'bkstar123_ajaxUploader';
    $.fn[pluginName] = function(options) {

        var settings = $.extend({}, $.fn[pluginName].defaults, options);

        function validateFile(file, uploadInputId) {
            let fileExtension = file.name.split('.').pop();
            let uploadErrorContainerDivId = '#bkstar123-ajaxuploader-error-for-' + uploadInputId;
            if (settings.allowedExtensions.indexOf(fileExtension) < 0) {
                $(uploadErrorContainerDivId).append("<li>" + fileExtension + " is not allowed</li>");
                $(uploadErrorContainerDivId).show();
                return false;
            }

            if (file.size > settings.size) {
                $(uploadErrorContainerDivId).append("<li>" + file.name + " (" + file.size + " bytes) exceeds upload limit</li>");
                $(uploadErrorContainerDivId).show();
                return false;
            }
            return true;
        }

        function validateBatch(files, uploadInputId) {
            let uploadErrorContainerDivId = '#bkstar123-ajaxuploader-error-for-' + uploadInputId;
            if (files.length > settings.batchSize) {
                $(uploadErrorContainerDivId).append("<li>The upload exceeds the limit of " + settings.batchSize + " files</li>");
                $(uploadErrorContainerDivId).show();
                return false;
            }
            return true;
        }

        function resetUploadStatus(uploadInputId) {
            $('#progress-' + uploadInputId).remove();
            $('#bkstar123-ajaxuploader-error-for-' + uploadInputId).remove();
            $('#bkstar123-ajaxuploader-success-for-' + uploadInputId).remove();
            $('#' + uploadInputId).val('');
        }

        function showUploadStatus(uploadInputId) {
            createUploadErrorContainerDiv(uploadInputId);
            createUploadSuccessContainerDiv(uploadInputId);
        }

        function createUploadContainerDiv(uploadInputId) {
            let className = "bkstar123-ajaxuploader-container-" + uploadInputId;
            if ($('#' + className).length > 0) {
                return;
            }
            $('#' + uploadInputId).wrap('<div class="' + className + '" id="' + className + '"></div>');
        }

        function createUploadErrorContainerDiv(uploadInputId) {
            let rootContainerSelector = "#bkstar123-ajaxuploader-container-" + uploadInputId;
            let uploadErrorContainerDivId = 'bkstar123-ajaxuploader-error-for-' + uploadInputId;
            if ($('#' + uploadErrorContainerDivId).length > 0) {
                return;
            }
            let html = '<div class="alert alert-danger" ' +
                'id="' + uploadErrorContainerDivId +
                '" style="display:none" role="alert"></div>';
            $(rootContainerSelector).append(html);
        }

        function createUploadSuccessContainerDiv(uploadInputId) {
            let rootContainerSelector = "#bkstar123-ajaxuploader-container-" + uploadInputId;
            let uploadSuccessContainerDivId = 'bkstar123-ajaxuploader-success-for-' + uploadInputId;
            if ($('#' + uploadSuccessContainerDivId).length > 0) {
                return;
            }
            let html = '<div class="alert alert-success" ' +
                'id="' + uploadSuccessContainerDivId +
                '" style="display:none" role="alert"></div>';
            $(rootContainerSelector).append(html);
        }

        function createUploadProgressContainerDiv(uploadInputId) {
            let rootContainerSelector = "#bkstar123-ajaxuploader-container-" + uploadInputId;
            let progressBarDivId = 'progress-bar-' + uploadInputId;
            if ($('#' + progressBarDivId).length > 0) {
                return;
            }
            let html = '<div class="progress" id="progress-' + uploadInputId + '">' +
                '<div class="progress-bar" id="' + progressBarDivId +
                '" role="progressbar" style="width: 0%" aria-valuenow="25"' +
                ' aria-valuemin="0" aria-valuemax="100"></div> </div>';
            $(rootContainerSelector).prepend(html);
        }

        function sendFile(file, uploadInputId, uploadInputName) {
            if (!validateFile(file, uploadInputId)) {
                return;
            }
            createUploadProgressContainerDiv(uploadInputId);
            let fd = new FormData();
            fd.append(uploadInputName, file);
            fd.append('_token', $('meta[name="csrf-token"]').attr('content'));

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        let uploadSuccessContainerDivId = '#bkstar123-ajaxuploader-success-for-' + uploadInputId;
                        $(uploadSuccessContainerDivId).append("<li>" + JSON.parse(xhr.responseText).filename + " has been uploaded</li>");
                        $(uploadSuccessContainerDivId).show();
                    } else {
                        let uploadErrorContainerDivId = '#bkstar123-ajaxuploader-error-for-' + uploadInputId;
                        $(uploadErrorContainerDivId).append("<li>" + JSON.parse(xhr.responseText) + "</li>");
                        $(uploadErrorContainerDivId).show();
                    }
                }
            };
            xhr.upload.onprogress = function(event) {
                let uploadProgressBarDivId = '#progress-bar-' + uploadInputId;
                if (event.lengthComputable) {
                    let percentComplete = event.loaded / event.total;
                    percentComplete = parseInt(percentComplete * 100);
                    $(uploadProgressBarDivId).css('width', percentComplete + '%')
                }
            };

            xhr.open('POST', '/upload', true);
            xhr.send(fd);
        }

        var uploadInputId = $(this).attr('id');
        var uploadInputName = $(this).attr('name');
        createUploadContainerDiv(uploadInputId);

        $(this).click(function() {
            resetUploadStatus(uploadInputId);
        });

        $(this).change(function(e) {
            e.preventDefault();
            showUploadStatus(uploadInputId);
            let files = $(this)[0].files;
            if (!validateBatch(files, uploadInputId)) {
                return;
            }
            for (let i = 0; i < files.length; i++) {
                sendFile(files[i], uploadInputId, uploadInputName);
            }
        })

        return this; //for chainablity
    };
    $.fn[pluginName].defaults = {
        size: 5242880, //5MB
        allowedExtensions: ['png', 'jpg', 'jpeg', 'mp4', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'pdf'],
        batchSize: 5,
    };
})(jQuery, window, document);