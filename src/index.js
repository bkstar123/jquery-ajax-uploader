/**
 * jQuery bkstar123-ajaxuploader plugin
 * author: tuanha
 * last-mod: 2019-Jul-03
 * Licensed under the MIT license
 */
;
(function($, window, document, undefined) {
    "use strict";
    let pluginName = 'bkstar123_ajaxuploader';
    $.fn[pluginName] = function(options) {
        let settings = $.extend({}, $.fn[pluginName].defaults, options);

        // Validate file extension, size
        function validateFile(file, uploadInputId) {
            let fileExtension = file.name.split('.').pop();
            let uploadErrorContainerDivSelector = `#${settings.prefix}-error-for-${uploadInputId}`;
            if (settings.allowedExtensions.indexOf(fileExtension) < 0) {
                $(uploadErrorContainerDivSelector).append(`<li>${fileExtension} extension is not allowed</li>`);
                $(uploadErrorContainerDivSelector).show();
                return false;
            }

            if (file.size > settings.size) {
                $(uploadErrorContainerDivSelector).append(`<li>${file.name} (${file.size} bytes) exceeds upload limit</li>`);
                $(uploadErrorContainerDivSelector).show();
                return false;
            }
            return true;
        }

        // Validate batch size <-> max number of files in parallel upload
        function validateBatch(files, uploadInputId) {
            let uploadErrorContainerDivSelector = `#${settings.prefix}-error-for-${uploadInputId}`;
            if (files.length > settings.batchSize) {
                $(uploadErrorContainerDivSelector).append(`<li>The upload exceeds the limit of ${settings.batchSize} files</li>`);
                $(uploadErrorContainerDivSelector).show();
                return false;
            }
            return true;
        }

        // Check if a DOM element exists
        function elementExist(selector) {
            return $(selector).length > 0;
        }

        // add upload alert
        function addUploadAlert(containerSelector, message) {
            if (message && typeof message === 'string') {
                $(containerSelector).append(`<li>${message}</li>`);
                $(containerSelector).show();
            }
        }

        // Remove the container of all progress bars, remove error/success alert containers, clear file input
        function resetUploadStatus(uploadInputId) {
            $(`#progress-${uploadInputId}`).remove();
            $(`#${settings.prefix}-error-for-${uploadInputId}`).remove();
            $(`#${settings.prefix}-success-for-${uploadInputId}`).remove();
            $(`#${uploadInputId}`).val('');
        }

        // Create error/success alert container
        function showUploadStatus(uploadInputId) {
            createUploadErrorContainerDiv(uploadInputId);
            createUploadSuccessContainerDiv(uploadInputId);
        }

        // Create an outer container div for uploading section
        function createUploadContainerDiv(uploadInputId) {
            let className = `${settings.prefix}-container-${uploadInputId}`;
            if (!elementExist(`#${className}`)) {
                $(`#${uploadInputId}`).wrap(`<div class="${className}" id="${className}"></div>`);
                $(`#${className}`).addClass(settings.outerClass);
            }
        }

        // Create a container for error alert
        function createUploadErrorContainerDiv(uploadInputId) {
            let rootContainerSelector = `#${settings.prefix}-container-${uploadInputId}`;
            let uploadErrorContainerDivId = `${settings.prefix}-error-for-${uploadInputId}`;
            if (!elementExist(`#${uploadErrorContainerDivId}`)) {
                let html = '<div class="alert alert-danger"' +
                    ` id="${uploadErrorContainerDivId}"` +
                    ' style="display:none" role="alert"></div>';
                $(rootContainerSelector).append(html);
            }
        }

        // Create a container for success alert
        function createUploadSuccessContainerDiv(uploadInputId) {
            let rootContainerSelector = `#${settings.prefix}-container-${uploadInputId}`;
            let uploadSuccessContainerDivId = `${settings.prefix}-success-for-${uploadInputId}`;
            if (!elementExist(`#${uploadSuccessContainerDivId}`)) {
                let html = '<div class="alert alert-success"' +
                    ` id="${uploadSuccessContainerDivId}"` +
                    ' style="display:none" role="alert"></div>';
                $(rootContainerSelector).append(html);
            }
        }

        // Create a progress container for the selected file input & other sub-container for each upload file
        function createUploadProgressContainerDiv(uploadInputId, fileIndex, file) {
            let rootContainerSelector = `#${settings.prefix}-container-${uploadInputId}`;
            let progressContainerDivId = `progress-${uploadInputId}`;

            if (!elementExist(`#${progressContainerDivId}`)) {
                $(rootContainerSelector).prepend(`<div id="${progressContainerDivId}"></div>`); // progress container
            }

            // sub-container for each upload file
            let progressBarDivId = `progress-bar-${uploadInputId}-${fileIndex}`;
            if (!elementExist(`#${progressBarDivId}`)) {
                let label = `<label>${file.name}</label>`;
                let progressBarHTML = '<div class="progress" style="height:1.2rem">' +
                    `<div class="progress-bar ${settings.progressBarColor} progress-bar-striped"` +
                    ` id="${progressBarDivId}"` +
                    ' role="progressbar" style="width: 0%" aria-valuenow="0"' +
                    ' aria-valuemin="0" aria-valuemax="100"></div></div>';
                $(`#${progressContainerDivId}`).append(label + progressBarHTML);
            }
        }

        // Send file to server
        function sendFile(fileIndex, file, uploadInputId, uploadInputName) {
            if (!validateFile(file, uploadInputId)) {
                return;
            }
            createUploadProgressContainerDiv(uploadInputId, fileIndex, file);

            let fd = new FormData();
            fd.append(uploadInputName, file);

            let xhr = new XMLHttpRequest();
            let uploadProgressBarDivSelector = `#progress-bar-${uploadInputId}-${fileIndex}`;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        let uploadSuccessContainerDivSelector = `#${settings.prefix}-success-for-${uploadInputId}`;
                        addUploadAlert(uploadSuccessContainerDivSelector, JSON.parse(xhr.responseText).success);
                    } else {
                        let uploadErrorContainerDivSelector = `#${settings.prefix}-error-for-${uploadInputId}`;
                        addUploadAlert(uploadErrorContainerDivSelector, JSON.parse(xhr.responseText).error);
                        $(uploadProgressBarDivSelector).removeClass(settings.progressBarColor);
                        $(uploadProgressBarDivSelector).addClass('bg-danger');
                    }
                    settings.onResponse(xhr.response);
                }
            };
            xhr.upload.onprogress = function(event) {
                if (event.lengthComputable) {
                    let percentComplete = event.loaded / event.total;
                    percentComplete = parseInt(percentComplete * 100);
                    $(uploadProgressBarDivSelector).css('width', `${percentComplete}%`);
                    $(uploadProgressBarDivSelector).text(`${percentComplete}%`);
                }
            };

            xhr.open('POST', settings.uploadUrl, true);

            let token = document.head.querySelector('meta[name="csrf-token"]');
            if (token) {
                xhr.setRequestHeader('X-CSRF-TOKEN', token.content);
            } else {
                console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
            }

            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            settings.beforeSend(xhr);
            xhr.send(fd);
        }

        let uploadInputId = $(this).attr('id');
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
            let uploadInputName = $(this).attr('name');
            for (let i = 0; i < files.length; i++) {
                sendFile(i, files[i], uploadInputId, uploadInputName);
            }
        })

        return this; //for chainablity
    };
    $.fn[pluginName].defaults = {
        size: 5242880, //5MB
        uploadUrl: '/upload',
        batchSize: 5,
        outerClass: '',
        progressBarColor: 'bg-primary',
        prefix: 'bkstar123-ajaxuploader',
        allowedExtensions: ['png', 'jpg', 'jpeg', 'mp4', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'pdf'],
        beforeSend(xhr) {},
        onResponse(response) {}
    };
})(jQuery, window, document);