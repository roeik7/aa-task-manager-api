const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')


// GET /tasks?complete=true
// GET /tasks?limit=10&skip=20
//GET /tasks?sortBy=createdAt:asc/desc

router.get('/tasks', auth, async (req, res) => {
    
    try{
        const match = {}
        const sort={}

        if (req.query.completed){
            match.completed = req.query.completed ==='true'
        }

        if (req.query.sortBy){
            const parts = req.query.sortBy.split(':')
            sort[parts[0]]= parts[1]==='desc' ? -1 : 1
        }
        //const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch(e){
        res.status(500).send()
    }
    
})

router.get('/tasks/:id', auth, async (req, res) => {
    
    try{
        const _id = req.params.id
        //const task = await Task.findById(_id)
        const task = await Task.findOne({_id, owner: req.user._id})
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})



router.patch('/tasks/:id', async (req,res)=>{
    try{
        const updates = Object.keys(req.body)
        const allowed_updates = ['description', 'completed']
        const is_valid_operation = updates.every((update)=> allowed_updates.includes(update))

        if(!is_valid_operation){
            return res.status(404).send('error: invalid update task')
        }
        
        const task = await Task.findOne({_id:req.params.id, owner: req.user._id})
        //const task = await Task.findById(req.params.id)

        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators: true})

        if(!task){
            return res.status(404).send()
        }

        updates.forEach((update)=> task[update]=req.body[update])
        await task.save()

        res.send(task)
    } catch(e){
        res.status(400).send(e)
    }
})


router.delete('/tasks/:id', auth, async(req,res)=>{
    try{
        //const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({_id:req.params.id, owner: req.user._id})
        
        
        if(!task){
            return res.status(404).send()
        }

        res.send(task)
    } catch(e){
        res.status(500).send(e)
    }
})

router.post('/tasks',auth, async (req, res) => {
    try {
        const task = new Task({
           ...req.body,
           owner:req.user._id 
        })

        await task.save()
        res.status(201).send(task)
    } catch (e){
        res.status(400).send(e)
    }
})

module.exports = router