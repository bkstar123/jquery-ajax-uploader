/**
 * jQuery bkstar123-ajaxuploader plugin
 * author: tuanha
 * last-mod: 2019-06-30
 * Licensed under the MIT license
 */
;
(function($, window, document, undefined) {

    let pluginName = 'bkstar123_ajaxuploader';
    $.fn[pluginName] = function(options) {
        let settings = $.extend({}, $.fn[pluginName].defaults, options);

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

        function validateBatch(files, uploadInputId) {
            let uploadErrorContainerDivSelector = `#${settings.prefix}-error-for-${uploadInputId}`;
            if (files.length > settings.batchSize) {
                $(uploadErrorContainerDivSelector).append(`<li>The upload exceeds the limit of ${settings.batchSize} files</li>`);
                $(uploadErrorContainerDivSelector).show();
                return false;
            }
            return true;
        }

        function resetUploadStatus(uploadInputId) {
            $(`#progress-${uploadInputId}`).remove();
            $(`#${settings.prefix}-error-for-${uploadInputId}`).remove();
            $(`#${settings.prefix}-success-for-${uploadInputId}`).remove();
            $(`#${uploadInputId}`).val('');
        }

        function showUploadStatus(uploadInputId) {
            createUploadErrorContainerDiv(uploadInputId);
            createUploadSuccessContainerDiv(uploadInputId);
        }

        function createUploadContainerDiv(uploadInputId) {
            let className = `${settings.prefix}-container-${uploadInputId}`;
            if ($(`#${className}`).length > 0) {
                return;
            }
            $(`#${uploadInputId}`).wrap(`<div class="${className}" id="${className}"></div>`);
            $(`#${className}`).addClass(settings.outerClass);
        }

        function createUploadErrorContainerDiv(uploadInputId) {
            let rootContainerSelector = `#${settings.prefix}-container-${uploadInputId}`;
            let uploadErrorContainerDivId = `${settings.prefix}-error-for-${uploadInputId}`;
            if ($(`#${uploadErrorContainerDivId}`).length > 0) {
                return;
            }
            let html = `<div class="alert alert-danger" id="${uploadErrorContainerDivId}" style="display:none" role="alert"></div>`;
            $(rootContainerSelector).append(html);
        }

        function createUploadSuccessContainerDiv(uploadInputId) {
            let rootContainerSelector = `#${settings.prefix}-container-${uploadInputId}`;
            let uploadSuccessContainerDivId = `${settings.prefix}-success-for-${uploadInputId}`;
            if ($(`#${uploadSuccessContainerDivId}`).length > 0) {
                return;
            }
            let html = `<div class="alert alert-success" id="${uploadSuccessContainerDivId}" style="display:none" role="alert"></div>`;
            $(rootContainerSelector).append(html);
        }

        function createUploadProgressContainerDiv(uploadInputId) {
            let rootContainerSelector = `#${settings.prefix}-container-${uploadInputId}`;
            let progressBarDivId = `progress-bar-${uploadInputId}`;
            if ($(`#${progressBarDivId}`).length > 0) {
                return;
            }
            let html = `<div class="progress" id="progress-${uploadInputId}"><div class="progress-bar" id="${progressBarDivId}"` +
                'role="progressbar" style="width: 0%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div></div>';
            $(rootContainerSelector).prepend(html);
        }

        function sendFile(file, uploadInputId, uploadInputName) {
            if (!validateFile(file, uploadInputId)) {
                return;
            }
            createUploadProgressContainerDiv(uploadInputId);

            let fd = new FormData();
            fd.append(uploadInputName, file);

            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        let uploadSuccessContainerDivSelector = `#${settings.prefix}-success-for-${uploadInputId}`;
                        $(uploadSuccessContainerDivSelector).append(`<li>${JSON.parse(xhr.responseText).success}</li>`);
                        $(uploadSuccessContainerDivSelector).show();
                    } else {
                        let uploadErrorContainerDivSelector = `#${settings.prefix}-error-for-${uploadInputId}`;
                        $(uploadErrorContainerDivSelector).append(`<li>${JSON.parse(xhr.responseText).error}</li>`);
                        $(uploadErrorContainerDivSelector).show();
                    }
                    settings.onResponse(xhr.response);
                }
            };
            xhr.upload.onprogress = function(event) {
                let uploadProgressBarDivSelector = `#progress-bar-${uploadInputId}`;
                if (event.lengthComputable) {
                    let percentComplete = event.loaded / event.total;
                    percentComplete = parseInt(percentComplete * 100);
                    $(uploadProgressBarDivSelector).css('width', `${percentComplete}%`)
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
                sendFile(files[i], uploadInputId, uploadInputName);
            }
        })

        return this; //for chainablity
    };
    $.fn[pluginName].defaults = {
        size: 5242880, //5MB
        uploadUrl: '/upload',
        batchSize: 5,
        outerClass: '',
        prefix: 'bkstar123-ajaxuploader',
        allowedExtensions: ['png', 'jpg', 'jpeg', 'mp4', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'pdf'],
        beforeSend(xhr) {},
        onResponse(response) {}
    };
})(jQuery, window, document);