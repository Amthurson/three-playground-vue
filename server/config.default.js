config.multipart = {
    fieldNameSize: 100, //字段名称长度限制
    fieldSize: '1mb', //字段值长度大小限制，比如富文本有时添加多媒体后就会很大，此处要调高限制。
    fields: 50, //字段数量限制 
    fileSize: '100mb',//上传文件大小限制
    files: 10,//上传文件数量限制
};