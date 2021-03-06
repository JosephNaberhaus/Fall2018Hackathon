
module.exports = function api(io){

    const express = require('express');
    const api = express.Router();
    const formidable = require('formidable');
    const pictureModel = require("../models/pictureModel.js");
    const util = require("util");

    const config = require("../config.js");

    api.get("/", (req,res) => {
        res.json({
            "name":config.name,
            "apiVersion": config.apiVersion,
            "Owner": config.owner
        });
    });

    api.get("/index", (req,res) => {
        res.json({
            "name":config.name,
            "apiVersion": config.apiVersion,
            "Owner": config.owner
        });
    });


    api.post("/upload", (req, res) => {
        let form = new formidable.IncomingForm();

        form.uploadDir = config.path + "/public/uploads";
        form.keepExtensions = true;
        form.maxFieldsSize = 20 * 1024 * 1024;
        form.maxFields = 1000;

		var thumb = require('node-thumbnail').thumb;
        form.parse(req, (err, fields, files) => {
            if (err) throw err;
            form.openedFiles.forEach((file) => {

                let origFileName = file.name;
                let fileName = (file.path.substring(config.path.length + "/public".length, file.path.length));
                let album = fields.album;
                let tags;
                if(typeof(fields["tags-input"]) != "undefined"){
                    tags = fields["tags-input"].split(",");
                }

                let picture = new pictureModel({
                    origFileName: origFileName,
                    fileName: fileName,
                    album: album,
                    tag: tags
                });

                picture.save((err) => {
                    if (err) throw err;
                    io.sockets.emit('new', picture);

                    resolve = require('path').resolve

                    thumb({
                    	source: resolve(config.path + '/public/uploads/'),
                    	destination: resolve(config.path + '/public/thumbnails/'),
                        suffix: '_big',
                    	width: 1000,
                    	height: 1000,
                        skip: true,
                        ignore: false,
                        digest: false
                    }).then(() => {
                    	console.log("Success");
                    }).catch((e) => {
                    	 console.log(e);
                    });

                    thumb({
                        source: resolve(config.path + '/public/uploads/'),
                        destination: resolve(config.path + '/public/thumbnails/'),
                        suffix: '_small',
                        width: 200,
                        height: 200,
                        skip: true,
                        ignore: false,
                        digest: false
                    }).then(() => {
                        console.log("Success");
                    }).catch((e) => {
                         console.log(e);
                    });

                });

            });
            res.redirect("/pictures/upload.html");
        });

        form.on('file', (name, file) => {
            console.log("Upload " + file.name);
        });

    });

    api.get("/photos", (req,res) => {
        pictureModel.find({status: true}, (err, data) => {
            if (err) throw err;

            res.json(data);
        });
    });


    api.get("/delete:id?", (req,res) => {
        let id = req.query.id;

        pictureModel.findById(id, (err,data) => {
            if(err) throw err;

            data.status = false;

            let picture = new pictureModel(data);

            picture.save((err) => {
                if (err) throw err;

                res.redirect("/pictures/view.html");

            });

        });

    });

    api.get('/download:id?', function(req, res){
        let id = req.query.id;
        console.log()
        console.log(id);
        pictureModel.findById(id, (err, data) => {

            let file = __dirname.substring(__dirname, __dirname.length-4) + "/public" + data.fileName;

            res.download(file);
        });
        
    });

    api.post('/edit', function(req,res){
        let id = req.body.id;

        pictureModel.findById(id, (err, data) => {
            if (err) throw err;
            
           data.origFileName = res.body.origFileName;
           data.album = req.body.album;
           data.tags = req.body.tags;

            let picture = new pictureModel(data);

            picture.save((err) => {
                if (err) throw err;

                res.redirect("/pictures/view.html");

            });

        });
    });

    return api;

}