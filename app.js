var express = require('express')
var ejs     = require('ejs')
var body    = require('body-parser')
var cookie  = require('cookie-parser')
var mysql   = require('mysql')
var database = {
  host: '127.0.0.1',
  user: 'dekidol',
  password: 'dekidol7',
  database: 'dekidol'
}
var pool    = mysql.createPool(database)
var app     = express()
var valid   = [ ]
app.engine('html', ejs.renderFile)
app.listen(1080)
app.use( body.urlencoded({extended:false}) )
app.use( cookie() )
app.get('/', showIndex)
app.get('/login', showLogInPage)
app.post('/login', checkLogIn)
app.get('/profile', showProfilePage)
app.post('/profile', saveProfile)
app.get('/logout', logoutUser)
app.get('/register', showRegisterPage)
app.post('/register', saveNewUser)
app.use( express.static('public') )
app.get('/:user', showUserProfile)
app.use( showError )
function showIndex(req, res)     { res.render('index.html') }
function showLogInPage(req, res) { res.render('login.html') }
function checkLogIn(req, res) {
    pool.query('select * from member where name=? and ' +
        'password=sha2(?, 512)', 
        [req.body.name, req.body.password],
        (error, data) => {
            if (data.length == 0) {
                res.redirect('/login')
            } else {
                var card = generateCard()
                valid[card] = data[0]
                res.header('Set-Cookie', 'card=' + card)
                res.redirect('/profile')
            }
        })
}
function showError(req, res) {
    res.render('error.html')
}

function generateCard() {
    var a = parseInt( Math.random() * 10000 )
    var b = parseInt( Math.random() * 10000 )
    var c = parseInt( Math.random() * 10000 )
    var d = parseInt( Math.random() * 10000 )
    return a + '-' + b + '-' + c + '-' + d
}

function showProfilePage(req, res) {
    if (valid[req.cookies.card]) {
        res.render('profile.html', {user: valid[req.cookies.card]})
    } else {
        res.redirect('/login')
    }
}

function logoutUser(req, res) {
    delete valid[req.cookies.card]
    res.redirect('/')
}

function showRegisterPage(req, res) {
	res.render('register.html')
}

function saveNewUser(req, res) {
	pool.query('insert into member(name, password, full_name) ' +
		'values(?,sha2(?, 512),?)',
		[req.body.name, req.body.password, req.body.full_name],
		(error, data) => {
			res.redirect('/login')
		}
	)
}

function saveProfile(req, res) {
    if (valid[req.cookies.card]) {
        var user = valid[req.cookies.card]
        user.full_name = req.body.full_name
        user.info = req.body.info
        valid[req.cookies.card] = user
        var sql = `update member 
        set full_name = ?, info = ? 
        where id = ? 
        `
        pool.query(sql, 
            [user.full_name, user.info, user.id],
            (error, data) => {
                res.redirect('/profile')
            })
    } else {
        res.redirect('/login')
    }
}

function showUserProfile(req, res, next) {
  pool.query('select * from member where name=?', [req.params.user],
    (error, data) => {
      if (data.length == 0) {
        next()
      } else {
        res.render('user.html', {user: data[0]})
      }
    }
  )

}







//
