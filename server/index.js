var express = require('express');
var https = require('https');
const path = require('path');
var fs = require('fs');
var fsp = require('fs/promises');
const { application } = require('express');
var convert = require('xml-js');

const options = {
    // 私钥
    key: fs.readFileSync(__dirname + "/cert/cert.key"),
    // 由私钥生成的证书
    cert: fs.readFileSync(__dirname + "/cert/cert.crt"),
};
var app = express();

app.use(express.json())

app.all("*",function(req,res,next){
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers","*");
    //跨域允许的请求方式 
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
    // console.log("1.",req);
    if(req.method.toLowerCase()==='options') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 模型文件接口
app.get('*', async (req,res)=>{
    const filePath = req.url.split('?')[0];
    let resData = {
        code: 2000,
        message: "ok"
    };
    // fs.readFile('./server/'+filePath, 'utf8').then((data)=>{
    //     error && console.log(error);
    //     res.send(data);
    // }).catch(err=>{
    //     resData = {
    //         ...resData,
    //         code: 500,
    //         msg: JSON.stringify(err)
    //     };
    //     res.send(resData);
    // });
    fs.readFile('./server/'+filePath,(error,data)=>{
        // 
        error && console.log(error);
        res.send(data);
    })
    // const data = await fs.readFile('./server/'+filePath);
    // res.send(data);
});

// 模型属性接口
app.post('*', async (req,res)=>{
    const {url,body} = req;
    if(url.indexOf('/attrs')!==-1) {
        const { filePath, modelName, externalId } = body;
        const sqlite3 = require('sqlite3').verbose();
        const fileName = modelName.split('.')[0];
        const db = new sqlite3.Database('./server'+filePath+fileName+'.sdb',(err)=>{
            if(err) throw err;
        });
        db.serialize(() => {
            const sql = "select * from (select * from _objects_attr t left join (select p.value_id,p.attribute_id from _objects_eav p,_objects_id q where q.external_id = '"+externalId+"' and p.entity_id=q.id) a on t.id = a.attribute_id) c left join _objects_val u on c.value_id = u.id"
            db.all(sql,(err,rows)=>{
                if(err) {
                    res.send({
                        code: -1,
                        message: err
                    });
                    return;
                }
                res.send({
                    code: 200,
                    message: 'ok',
                    data: rows
                })
            })
        });
        db.close();
    }
    if(url.indexOf('/getGeoJsonKmlData')!==-1) {
        let resData = {
            code: 200,
            message: "ok"
        };

        xmlData = await fsp.readFile('./server/geoJsonData/chinaboundary.kml', 'utf8');
        // .then((xmlData)=>{
        const { kml } = JSON.parse(convert.xml2json(xmlData, {compact: true, spaces: 4}));
        const data = kml.Document.Folder.map(v=>({
            name: v.name._text,
            polygons: v.Placemark && v.Placemark.length>0 ? v.Placemark.map(v2=>({
                coordinates: v2.Polygon.outerBoundaryIs.LinearRing.coordinates._text.split(' ').map(v3=>v3.split(',').map(v4=>+v4))
            })) : []
        }));
        resData = {
            ...resData,
            data
        };
        // console.log(data);
        res.send(resData)
        // }).catch(err=>{
        //     resData = {
        //         ...resData,
        //         code: 500,
        //         msg: JSON.stringify(err)
        //     };
        //     res.send(resData)
        // });

        // fsp.readFile('./server/geoJsonData/chinaboundary.xml', (error,xmlData)=>{
        //     const data = JSON.parse(convert.xml2json(xmlData, {compact: true, spaces: 4}));
        //     console.log(xmlData)
        //     error && console.log(error);
        // });

        // .then((xmlData)=>{
            // const data = JSON.parse(convert.xml2json(xmlData, {compact: true, spaces: 4}));
            // resData = {
            //     ...resData,
            //     data
            // };
            // res.send(resData)
        // }).catch(err=>{
            // resData = {
            //     ...resData,
            //     code: 500,
            //     msg: JSON.stringify(err)
            // };
            // console.log(resData)
            // res.send(resData)
        // });
    }
})

app.use(express.static('./'));
app.listen(9231,"0.0.0.0",()=>{
    console.log('This app listening on port 9231!\n');
});
// https.createServer(options,app).listen(443,"0.0.0.0",undefined,()=>{
//     console.log('This app listening on port 9231!\n');
// });