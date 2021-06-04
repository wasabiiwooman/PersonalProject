const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()

mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/*-----------Schema Declarations------------*/
let exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String,
  __v: {type: Number, select: false}
});

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema],
  __v: {type: Number, select: false}
})

let Exercise = mongoose.model('Exercise', exerciseSchema);
let User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// App Methods
app.post('/api/users', bodyParser.urlencoded({extended: false}), (req, res) => {
  let newUser = new User({username: req.body.username})

  newUser.save((err, data) => {
    if(err) {
      console.errror(err)
    } else {
      let resObject = {}
      resObject['username'] = data.username
      resObject['_id'] = data._id
      res.json(resObject)
    }
  })
})

app.get('/api/users', (req, res) => {
  User.find({}, (err, userArray) => {
    if (err) {
      console.error(err)
    } else {
      res.json(userArray)
    }
  })
})

app.post('/api/users/:_id/exercises', bodyParser.urlencoded({extended: false}),(req, res) => {
  let newExercise = new Exercise({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  })

  if (newExercise.date === '') {
    newExercise.date = new Date().toISOString().substring(0, 10)
  }

  let inputId = req.params._id

  User.findByIdAndUpdate(
    inputId, 
    {$push: {log: newExercise}}, 
    {new: true},
    (err, userData) => {
    if (err) {
      console.error(err)
    } else {
      let resObject = {}
      resObject['_id'] = inputId
      resObject['username'] = userData.username
      resObject['description'] = newExercise.description
      resObject['duration'] = newExercise.duration
      resObject['date'] = new Date(newExercise.date).toDateString()
      res.json(resObject)
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  let inputId = req.params._id

  User.findOne()
  User.findById(inputId, (err, userData) => {
    if (err) {
      console.error(err)
    } else {
      
      /* Count Limit */
    if(req.query.limit){
      userData.log = userData.log.slice(0, req.query.limit)
    }

    /*Date Filter */
    if(req.query.from || req.query.to){
      let fromDate = new Date(0)
      let toDate = new Date()
      
      if(req.query.from){
        fromDate = new Date(req.query.from)
      }
      
      if(req.query.to){
        toDate = new Date(req.query.to)
      }
      
      userData.log = userData.log.filter((exerciseItem) =>{
        let exerciseItemDate = new Date(exerciseItem.date)
        
        return exerciseItemDate.getTime() >= fromDate.getTime()
          && exerciseItemDate.getTime() <= toDate.getTime()
      })
      
    }
      var resObject = {}
      resObject['username'] = userData.username
      resObject['count'] = userData.log.length
      resObject['log'] = userData.log
      res.json(resObject)
    }
  })
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
