// Setup
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});

// Creating schema and default items
const itemsSchema = {
	name: String,
};

const listSchema = {
	name: String,
	items: [itemsSchema],
};

const Item = mongoose.model('Item', itemsSchema);

const List = mongoose.model('List', listSchema);

const item1 = new Item({
	name: 'Welcome to your todo List',
});

const item2 = new Item({
	name: 'Welcome Matthew',
});

const item3 = new Item({
	name: 'Do house chores',
});

const defaultItems = [item1, item2, item3];

// Get request for home directory
app.get('/', function (req, res) {
	Item.find({}, function (err, foundItems) {
		console.log(foundItems);

		if (foundItems.length == 0) {
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log('Successfully inserted into list');
				}
			});
			/*This redirect is added so that after the if statement above it comes back to this get
      function and goes to the else statement*/
			res.redirect('/');
		} else {
			res.render('list', { listTitle: 'Today', newListItems: foundItems });
		}
	});
});

// When user enters a custom directory
app.get('/:customListName', function (req, res) {
	const customListName = _.capitalize(req.params.customListName);
	List.findOne({ name: customListName }, function (err, foundList) {
		if (!err) {
			if (!foundList) {
				//Create new list
				const list = new List({
					name: customListName,
					items: defaultItems,
				});
				list.save();
				res.redirect('/' + customListName);
			} else {
				//Show existing list
				res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
			}
		}
	});
});

// Adding a new item to your list
app.post('/', function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});

	if (listName === 'Today') {
		item.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }, function (err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

// Deleting items
app.post('/delete', function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (!err) {
				console.log('Successfully deleted item');
				res.redirect('/');
			}
		});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemId } } },
			function (err, foundList) {
				if (!err) {
					res.redirect('/' + listName);
				}
			}
		);
	}
});

// About page
app.get('/about', function (req, res) {
	res.render('about');
});

app.listen(3000, function () {
	console.log('Server started on port 3000');
});
