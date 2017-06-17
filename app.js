const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const pg = require('pg');
const Sequelize = require('sequelize');
const db = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost/postgres`); 
const session = require('express-session');
const bcrypt = require('bcrypt')

app.set('views', __dirname + '/src/views');
app.set('view engine', 'pug');

app.use('/', bodyParser()); //creates key-value pairs request.body in app.post, e.g. request.body.username
app.use(express.static('src/public'));
app.use(session({
	secret: process.env.secret,
	resave: true,
	saveUninitialized: false
}));

var Account = db.define('account', {
	firstname: {type: Sequelize.STRING, allowNull: false, validate: {len: [3,32]}},
	lastname: {type: Sequelize.STRING, allowNull: false, validate: {len: [3,32]}},
	email: {type: Sequelize.STRING, allowNull: false, unique: true},
	password: {type: Sequelize.STRING, allowNull: false, validate: {len: [5,100]}}
});

var Post = db.define('post', {
	content: {type: Sequelize.STRING, allowNull: false}
});

var Comment = db.define('comment', {
	content: {type: Sequelize.STRING, allowNull: false}
});

Account.hasMany(Post);
Post.belongsTo(Account);

Account.hasMany(Comment);
Comment.belongsTo(Account);

Post.hasMany(Comment);
Comment.belongsTo(Post)

db.sync({force: true});

									//......MAKE AN ACCOUNT

app.get('/regaccount', function (req, res) {
	res.render('make-account')
});

app.post('/regaccount',function(req, res){
	const firstname = req.body.firstname
	const lastname = req.body.lastname
	const email = req.body.email
	const password = req.body.password
	const password_conf = req.body.password_conf
	const validateEmail = function(email) {
	    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return re.test(email);
	}
	Account.findOne({
		where: {
			email: email
		}
	})
	.then((user)=>{
		console.log('user'+ user)
		if(user){
			res.send('email already exists')
			return
		}		
		else if(validateEmail(email) === true && password === password_conf){
			bcrypt.hash('password', 10, (err, hash)=> {								
				Account.create({
					firstname: firstname,
					lastname: lastname,
					email: email,
					password: hash
				})
				.then((user)=> {
					res.redirect('/login')
				})	
			})			
		}
		else{throw err}
	})
})

									//......LOG IN TO ACCOUNT
app.get('/login', (req, res)=> {
	res.render('log-in')
})

app.post('/login', (req, res)=> {
	const email = req.body.email
	const password = req.body.password
	if (email.length === 0 || password.length === 0){
		res.render('log-in', {message: 'Please fill in your Email and your Password'})
		return;
	}
	else{
		Account.findOne({
		where: {email: email}
		})
		.then((user)=>{
			if(user !== null){
				bcrypt.compare('password', user.password, (err, result)=> {
					if (result === true){
						req.session.user = user;
						res.redirect('/profile')
					}
					else {
						res.render('log-in', {message: 'Invalid Email or Password'})
					}
				})
			}
			else{
				res.render('log-in', {message: 'Invalid Email or Password'})
			}	
		})
		.catch((err)=>{
			throw err
		})
	}	
})

app.get('/profile', function (req, res) {
	const user = req.session.user;
	if (user === undefined) {
		res.render('log-in', {message: "Please log in to view your profile."});
	} 
	else {
		const fullName = user.firstname +' '+ user.lastname
		const foreignKey = req.session.user.id;
		Post.findAll({order: '"updatedAt" DESC', include: [Account, {model: Comment, include: [Account]}],
			where :{
				accountId: foreignKey
			}

			//look in the docs under quer
		})
		.then( function(posts) {
			res.render('profile', {fullName: fullName, posts: posts});
		})
		
	}
});

app.post('/profile', (req, res)=>{
	const post = req.body.typedIn
	const foreignKey = req.session.user.id
	Post.create({
		content: post,
		accountId: foreignKey 
	})
	.then((content)=>{
		res.send(content.content)
	})
})

app.get('/allposts', (req, res)=>{
	const user = req.session.user;
	if (user === undefined) {
		res.render('log-in', {message: "Please log in to view the Posts."});
	}
	else{
		Post.findAll({
			order: '"updatedAt" DESC', 
			include: [Account, {model: Comment, include: [Account]}]
		})
		.then((posts)=>{
			res.render('all-posts',{posts: posts})
		})
	}
})

app.post('/comment', (req, res)=> {
	console.log("reached")
	// const comment = req.body.typedIn
	const comment = req.body.comment
	const postId = req.body.postId
	const accountId = req.session.user.id

	Comment.create({
		content: comment,
		accountId: accountId,
		postId: postId
	})
	.then((comment)=>{
		// res.send(comment)
		res.redirect('/allposts')
	})
})

app.get('/logout', (req, res)=> {
	req.session.destroy((err)=> {
		if (err){
			throw err
		}
		res.render('log-in', {message: 'You have successfully logged out'})
	})
})

const listener = app.listen(3000, function () {
	console.log('Example app listening on port: ' + listener.address().port);
});