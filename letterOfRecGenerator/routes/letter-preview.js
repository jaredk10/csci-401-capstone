var express = require('express');
var router = express.Router();
var Form = require('../models/form');
var nodemailer = require('nodemailer');
var credentials = require('../config/auth');
var googleAuth = require('google-auth-library');
var { google } = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var letterParser = require('./letter-parser');
//const HummusRecipe = require('hummus-recipe');
var PizZip = require('pizzip');
var Docxtemplater = require('docxtemplater');

var fs = require('fs');
var path = require('path');


//const Readable = require('stream').Readable;
//const fileUpload = require('express-fileupload');
//const opn = require('opn')
//const downloadsFolder = require('downloads-folder');

//docx stuff
const docx = require('docx');
const request = require('request');
const { Document, Paragraph, Packer } = docx;


router.get('/', function (req, res, next) {
    req.user.getForm(req.query.id, function (err, form) {
        if (err) {
            console.log("get /  error in letter-preivew: " + err );
        } else {
            res.render('pages/letter-preview', {
                title: form.email,
                id: req.query.id,
                form: form,
            });
        }
    });
});

router.get('/form', function (req, res, next) {
    req.user.getForm(req.query.id, function (err, form) {
        if (err) {
            console.log(err);
        } else {
            res.json(form);
        }
    });
});


router.post('/save', function (req, res, next) {
    Form.completeForm(req.body.id, req.body.letter, function (err, form) {
        if (err) {
            console.log(err);
        } else {
            res.render('pages/letter-preview', {
                title: form.email,
                id: req.query.id,
                form: form,
            });
        }
    });
});

router.post('/templateUpload', function (req,res, next) {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
    const filePath = __dirname + '/uploads/' + 'letterTemplate';
    try{
        if(fs.existsSync(filePath)){
            console.log("IT EXISTS");
                    //template is uploaded
            console.log("Template uploaded!");

            console.log(req.body.formID);
            var user = req.user;
            console.log("user:**********************");
            console.log(user._id);

            var pulled_text; //text that were getting and moving to docxtemplater
            //console.log(req.query.id);
            //console.log(req);
            console.log("^^^^^^^");
           // console.log(req.user.forms);

            user.getForm(req.body.formID, function (err, form) {
            if (err) {
                console.log(err);
            } else {
		console.log("\n\nForm:");
                console.log(form);
                pulled_text = req.body.letter;
		    
		console.log("\n\npulled_text:");
                console.log(pulled_text);
		    
		console.log("\n\nreq.body:");
                console.log(req.body);
		res.json(form);
		    
                var formatted_text = letterParser.htmlstuff(pulled_text);

                var content = fs
                        .readFileSync(filePath, 'binary');

                var zip = new PizZip(content);

                var doc = new Docxtemplater();
                doc.loadZip(zip);
                //enable linebreaks
                doc.setOptions({linebreaks:true});

                console.log("2");
                //set the templateVariables
                var date_raw = req.body.date;
                var actual_date = letterParser.getDate(date_raw);
                doc.setData({

                    //text with the line breaks included
                    date: actual_date,
                    description: formatted_text
                });

                try {
                    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                    doc.render()
                }
                catch (error) {
                    var e = {
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                        properties: error.properties,
                    }
                    console.log(JSON.stringify({error: e}));
                    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                    throw error;
                }
                console.log("3");
                var buf = doc.getZip()
                 .generate({type: 'nodebuffer'});

                // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                fs.writeFileSync(path.resolve('./routes/uploads', 'output.docx'), buf);

                console.log("4");
		    
		    
		    
		    const email_username = process.env.EMAILUSER;
    const email_password = process.env.EMAILPASS;
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
          user: email_username,
          pass: email_password
      },
      tls:{
        rejectUnauthorized:false
      }
    });

    var email = form.email;
    console.log("Email is: ", email);
    console.log("Form data: ", req.body.responseData);

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Letter of Rec Generator" <letterrecommender@gmail.com>', // sender address
        to: email, // list of receivers
        subject: 'Letter of Recommendation - Form Downloaded', // Subject line
        text: 'A recommender has previewed your recommendation letter.', // plain text body
//         html: '<p>' + req.body.body_text + ' ' + url + '</p>'// html body
    };

    if (req.body.notify == 'true') {
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            res.render('contact', { msg: 'Email has been sent' });
        });
    }
		    
		    
		    
		    
		    
            }
            });
        }
        else{
            //it doesnt exist
            //create file using blank page
        console.log("Template not uploaded");
        console.log(req.body.formID);
        var user = req.user;
        console.log("user:**********************");
        console.log(user._id);

        var pulled_text; //text that were getting and moving to docxtemplater

        //console.log(req.body.formID);
        user.getForm(req.body.formID, function (err, form) {
        if (err) {
            console.log(err);
        } else {

            //console.log(form.letter);
            pulled_text = form.letter;
            res.json(form);

            console.log(pulled_text);
            var formatted_text = letterParser.htmlstuff(pulled_text);

            var content = fs
                    .readFileSync(path.resolve('./routes/uploads', 'input.docx'), 'binary');

            var zip = new PizZip(content);

            var doc = new Docxtemplater();
            doc.loadZip(zip);
            //enable linebreaks
            doc.setOptions({linebreaks:true});

            console.log("2");
            //set the templateVariables
            doc.setData({

                //text with the line breaks included
                description: formatted_text
            });

            try {
                // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                doc.render()
            }
            catch (error) {
                var e = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    properties: error.properties,
                }
                console.log(JSON.stringify({error: e}));
                // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                throw error;
            }
            console.log("3");
            var buf = doc.getZip()
             .generate({type: 'nodebuffer'});

            // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
            fs.writeFileSync(path.resolve('./routes/uploads', 'output.docx'), buf);
            console.log("4");
        }
        });

        }
    } catch(err){
        console.log(err);
    }
})

router.post('/drive', function(req,res,next) {
    console.log("DRIVE DRIVE DRIVE DRIVE DRIVE DRIVE")
    var user = req.user;
    user.getForm(req.body.id, function(err, form) {
        if(err){
            console.log(err)
        } else {
            var break_lines = "<br><br>";
            var smaller_break_lines = "<br><br>";
            var date_raw = req.body.date;
            var actual_date = letterParser.getDate(date_raw);
            var formatted_date = break_lines + actual_date + smaller_break_lines;
            var letter = req.body.letter;
            var formatted_letter = formatted_date + letter;
            var template = form.getTemplate();
            var templateName = template.name;
           // console.log("THIS IS FORMATTED:" + formatted_letter);

            var text = letterParser.htmlstuff(formatted_letter);
            var longText = text.replace(/(\r\n|\n|\r)/gm, "<br>");
            //text = text.replace(/(\n)/gm, '')
            var fname = form.responses[0].response;
            var lname = form.responses[1].response;
            var length = longText.length;
            //console.log("TEXT:" + text)
            //var stringWords = longText.split(' ');
           // console.log("words: " + stringWords)
            var para = longText.split("<br>"); //split para into an array of paragraphs
            //var para2 = longText.replace(/<br\s*[\/]?>/gi, "\n");

           //create doc for docx
          /* const doc = new Document();

            //loop through para array and make a paragraph for each
            for (var x in para) {
                const temp_paragraph = new Paragraph(para[x]);
                doc.addParagraph(temp_paragraph);
                console.log(para[x]);
            }

            //place header, footer signature



            const packer = new docx.Packer();

            packer.toBuffer(doc).then((buffer) => {
            fs.writeFileSync("MyDocument4.docx", buffer);
            });
            */

            //load the docx file as a binary
			var content = fs
			    .readFileSync(path.resolve('./routes/uploads', 'input.docx'), 'binary');

			var zip = new PizZip(content);

			var doc = new Docxtemplater();
			doc.loadZip(zip);
			//enable linebreaks
			doc.setOptions({linebreaks:true});


			//set the templateVariables
			doc.setData({

			    //text with the line breaks included
			    description: text
			});

			try {
			    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
			    doc.render()
			}
			catch (error) {
			    var e = {
			        message: error.message,
			        name: error.name,
			        stack: error.stack,
			        properties: error.properties,
			    }
			    console.log(JSON.stringify({error: e}));
			    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
			    throw error;
			}
			var buf = doc.getZip()
             .generate({type: 'nodebuffer'});

			// buf is a nodejs buffer, you can either write it to a file or do anything else with it.
			fs.writeFileSync(path.resolve('./routes/uploads', 'output.docx'), buf);

            console.log("we made it");



            res.redirect('/recommender-dashboard');
        }

    });
})

router.get('/downloads', function(req, res) {
    console.log("Hi its Jerry");
    var file = path.resolve('./routes/uploads', 'output.docx');
    res.download(file);
});

function parseLetter(form) {
    var tagRegex = /\<\![a-z0-9_]+\>/ig;
    var letter = form.template.text;
    var responses = form.responses;

    var noCapitalization = Array.from(letter.replace(tagRegex, function (match) {
        var response = responses.find(function (item) {
            return item.tag.localeCompare(match, {sensitivity: 'base'}) == 0;
        });
        return response ? response.response : '';
    }).replace(tagRegex, function (match) {
        var response = responses.find(function (item) {
            return item.tag.localeCompare(match, {sensitivity: 'base'}) == 0;
        });
        return response ? response.response : '';
    }));

    for (var i = 0; i < noCapitalization.length; i++) {

        // Found ending punctuation that isn't the last letter in the text
        if ((noCapitalization[i] == '.' || noCapitalization[i] == '?' || noCapitalization[i] == '!') && i != noCapitalization.length - 1) {

            // Make sure exclamation point is not from a tag
            if (noCapitalization[i] == '!' && i > 0 && noCapitalization[i - 1] == '<') {
                continue;
            }

            // Look for the next alphabetical character to capitalize
            var j = i + 1;
            while (!((noCapitalization[j] >= 'a' && noCapitalization[j] <= 'z') || (noCapitalization[j] >= 'A' && noCapitalization[j] <= 'Z')) && j < noCapitalization.length) {
                j++;
            }

            // Found character to capitalize
            if (j < noCapitalization.length) {
                noCapitalization[j] = noCapitalization[j].toUpperCase();
            }
        }
    }

    return noCapitalization.join("");

}




module.exports = router;
