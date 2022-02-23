const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(()=>console.log('MongoDB connected...'))
        .catch(err => console.log(err));

     const Schema = mongoose.Schema;    

     const exerciseShema = new Schema({
         description: { type: String, required: true},
         date: String,
        duration: { type: Number, required: true},
     })  

      const peopleSchema = new Schema({
        username: { type: String, required: true},
        log: [exerciseShema]
     })
 
  
 const Person = mongoose.model('Person', peopleSchema);
const Exercise = mongoose.model('Excercise', exerciseShema)

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let resObj = {};
const createAndSavePerson = (req, res) =>{
       
       const person = new Person({username: req.body.username});

   person.save((err, data)=>{
        if(err){
          console.log(err);
        }else{
         // console.log(data);
           resObj['username'] = data.username;
            resObj['_id'] = data._id;
          res.json(resObj);
          
        }
   })
        
}

app.post('/api/users', (req, res)=>{

  createAndSavePerson(req, res); 
});

app.get('/api/users', (req, res)=>{

  Person.find()
        .select('_id username') 
        .exec((err, data)=>{
          if(!err){
            //console.log(data);
             res.json(data);
          }
        })
});


const addExercises = (req, res) =>{
     const dateNow = new Date();
     const date = new Date(req.body.date);

   const exercise = new Exercise({
     description: req.body.description,
     date: req.body.date === '' ?  dateNow.toDateString() : date.toDateString(),
     duration: parseInt(req.body.duration)
   });

    
   Person.findByIdAndUpdate(req.params._id,
   { $push : {log: exercise}}, {new: true}, (err, updatedPerson)=>{
           if(err){
             console.log(err);
           }else{

      resObj['_id'] = updatedPerson._id;
   resObj['username'] = updatedPerson.username;
resObj['date'] = exercise.date
   resObj['duration'] = exercise.duration;
 resObj['description']= exercise.description;
        
      
               console.log(resObj);
              res.json(resObj);

           }
   })
     
}
app.post('/api/users/:_id/exercises', (req, res)=>{
  
   addExercises(req, res);
  //console.log(req.body._id);
})

app.get('/api/users/:_id/logs', (req, res) =>{

 
   const { from, to, limit } = req.query;
 Person.findById(req.params._id, (err, personFound) =>{
   
       if(err){
         console.log(err);
       }else{
         console.log(personFound);
         if(req.query.from || req.query.to){

       let fromDate = new Date(0)
       let toDate = new Date()
            
         if(req.query.from){
               fromDate = new Date(req.query.from)
            }
          if(req.query.to){
             toDate = new Date(req.query.to)
          
          } 
     fromDate = fromDate.getTime()
     toDate = toDate.getTime() 


     personFound.log = personFound.log.filter((exercise) =>{
        let exerciseDate = new Date(exercise.date).getTime()

         return exerciseDate >= fromDate && exerciseDate <= toDate
     })

         }

       if(req.query.limit){
     personFound.log = personFound.log.slice(0, req.query.limit)
   }
         
        resObj['_id'] = personFound._id;
        resObj['username'] = personFound.username;
       // resObj = personFound;
        resObj['count'] = personFound.log.length;
       
         const dateNow = new Date();
        
         let arrOfLog = personFound.log.map((item)=>{
              if(item.date === 'Invalid Date'){
                   item.date = dateNow.toDateString()
              }
             return{
                description: item.description,
                 duration: item.duration,
                  date: item.date
             }
         })
         
          resObj['log'] = arrOfLog;
          
         res.json(resObj);
       }         
 })

})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
