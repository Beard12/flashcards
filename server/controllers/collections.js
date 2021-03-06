var mongoose = require('mongoose')
var Collection = mongoose.model('Collection')
var Subject = mongoose.model('Subject')
var User = mongoose.model('User')
var Notecard = mongoose.model('Notecard')

function collectionController(){
	this.getcollection = function(req,res){
		Collection.findOne({_id: req.params.id})
			.populate({path: '_reviews',
				populate:[
					{path: '_user'}
				]
			})
			.populate('_notecards _subject').exec(function(err,collection){
				if(err){
					res.json(err)
				}
				else{
					res.json(collection)
				}
			})
	}
	this.getcollectionsbysub = function(req,res){
		Subject.findOne({_id : req.body._sub})
			.populate({
				path: '_collections',
				match: {_user: req.body._user}
			})
			.exec(function(err, subject){
				if(err){
					res.json(err)
				}
				else{
					res.json(subject)
				}
			})
		}
	this.getcollectionsbyuser = function(req,res){
		Collection.find({_user : req.params.user}, function(err, collections){
			if(err){
				res.json(err)
			}
			else{
				res.json(collections)
			}
		})
	}
	this.getcollections = function(req,res){
		Collection.find({public:true}, function(err, collections){
			if(err){
				res.json(err)
			}
			else{
				res.json(collections)
			}
		})
	}
	this.addtotopcollections = function(req,res){
		User.findOne({_id: req.body._user}, function(err,user){
			user._topcollections.push(req.body._collection)
			user.save({validateBeforeSave: false },function(err){
				if(err){
					res.json(err)
				}
				else{
					res.send()
				}
			})
		})
	}

	this.addcollection = function(req,res){
		var collection = Collection({name: req.body.name, public: req.body.public, description: req.body.description, _user:req.body._user, _subject:req.body._subject})
		collection.save(function(err){
			if(err){
				res.json(err)
			}
			else{
				Subject.findOne({_id: req.body._subject}, function(err, subject){
					if(err){
						res.json(err)
					}
					else{
						subject._collections.push(collection)
						subject.save(function(err){
							if(err){
								res.json(err)
							}
							else{
								User.findOne({_id: req.body._user}, function(err, user){
									if(err){
										res.json(err)
									}
									else{
										user._collections.push(collection)
										user._topcollections.push(collection)
										user.save({validateBeforeSave: false }, function(err){
											if(err){
												res.json(err)
											}
											else{
												res.json(collection)
											}
										})
									}
								})
							}
						})
					}
				})
			}
		})
	}
	this.removecollection = function(req,res){
		Collection.remove({_id: req.params.id}, function(err){
			if(err){
				res.json(err)
			}
			else{
				User.findOne({_id: req.body._user}, function(err, user){
					if(err){
						res.json(err)
					}
					else{
						for(var i=0; i<user._collections.length; i++){
							if(user._collections[i] == req.body._collection){
								user._collections.splice(i,1)
								break;
							}
						}
						user.save({validateBeforeSave: false },function(err){
							if(err){
								res.json(err)
							}
							else {
								res.send()
							}
						})
					}
				})
			}
		})
	}
	this.removecollectionfromtop = function(req,res){
		User.findOne({_id: req.body._user}, function(err,user){
			if(err){
				res.json(err)
			}
			else{
				for(var i=0; i<user._topcollections.length; i++){
					if(user._topcollections[i] == req.body._collection){
						user._topcollections.splice(i,1)
						break;
					}
				}
				user.save({validateBeforeSave: false }, function(err){
					if(err){
						res.json(err)
					}
					else {
						res.send()
					}
				})
			}
		})
	}
	this.editcollection = function(req,res){
		Collection.findOne({_id: req.params.id}, function(err, collection){
			if(err){
				res.json(err)
			}
			else{
				collection.name = req.body.name;
				collection.description = req.body.description
				collection.public = req.body.public
				collection.save(function(err){
					if(err){
						res.json(err)
					}
					else{
						res.json(collection)
					}
				})
			}
		})
	}
	this.shufflecollection = function(req,res){
		Collection.findOne({_id:req.params.id}, function(err, collection){
			for(var i = 0; i < collection._notecards.length; i++){
				var repindex = Math.floor(Math.random()*collection._notecards.length)
				var repcardid = collection._notecards[repindex]
				var icardid = collection._notecards[i]
				var temp = repcardid
				collection._notecards.set(i,temp)
				collection._notecards.set(repindex,icardid)
			}
			collection.save(function(err){
				if(err){
					res.json(err)
				}
				else{
					res.json(collection)
				}
			})
		})
	}
	this.clonecollection = function(req,res){
		Collection.findOne({_id:req.params.id}).populate('_notecards').exec(function(err, collection){
			var clonecollection = Collection({name:collection.name, public: collection.public, description: collection.description, _subject : collection._subject, _user: req.body._user})
			clonecollection.save(function(err){
				if(err){
					console.log(err)
					res.json(err)
				}
				else{
					for(var i = 0; i < collection._notecards.length;i++){
						Notecard.findOne({_id: collection._notecards[i]._id}, function(err, notecard){
							var clonenotecard = Notecard({question: notecard.question, answer: notecard.answer, _collection: clonecollection._id})
							clonenotecard.save(function(err){
								if(err){
									res.json(err)
								}
								else{
									clonecollection._notecards.push(clonenotecard)
									clonecollection.save(function(err){
										if(err){
											res.json(err)
										}
										else{
											console.log(clonenotecard)
										}
									})
								}
							})
						})
					}
					User.findOne({_id:req.body._user}, function(err,user){
						if(err){
							res.json(err)
						}
						else{
							user._collections.push(clonecollection)
							user._topcollections.push(clonecollection)
							if(user._subjects.indexOf(clonecollection._subject) == -1){
								user._subjects.push(clonecollection._subject)
							}
							user.save({validateBeforeSave: false },function(err){
								if(err){
									res.json(err)
								}
								else{
									Subject.findOne({_id: collection._subject}, function(err, subject){
										subject._collections.push(clonecollection)
										subject.save(function(err){
											if(err){
												res.json(err)
											}
											else{
												res.json(user)
											}
										})
									})
								}
							})
						}
					})
				}

			})
		})
	}
}

module.exports = new collectionController()
