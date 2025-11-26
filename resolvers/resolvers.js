import bcrypt from 'bcryptjs';
import Todo from "../models/Todo.js";
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from "../models/User.js";
import Comment from '../models/Comment.js';
import Bookmark from '../models/Bookmark.js';
import Review from '../models/Review.js';
import { generateToken } from "../utils/auth.js";
import checkAuth from '../utils/checkAuth.js';
import fetch from 'node-fetch';



const resolvers = {
    Query: {
        me: async (_, __, context) => {
            const user = context.user;
            if (!user?.id) return null;
            const dbUser = await User.findById(user.id).select('email isAdmin').exec();
            if (!dbUser) return null;
            return { id: dbUser._id.toString(), email: dbUser.email, isAdmin: dbUser.isAdmin };
        },
        users: async (_, __, context) => {
            const user = context.user;
            if (!user?.isAdmin) {
                throw new Error("Unauthorized — only admins can view users");
            }
            const allUsers = await User.find().sort({ createdAt: -1 }).exec();
            const usersList =  allUsers.map(u => ({
                id: u._id.toString(),
                email: u.email,
                isAdmin: u.isAdmin,
                createdAt: u.createdAt ? u.createdAt.toISOString() : null,
            }));
            return usersList.filter(u => u.isAdmin !== user.isAdmin);

        },

        // Get all todos created by a specific user
            todosByUser: async (_, { userId }, context) => {
            const user = context.user;
            if (!user?.id) throw new Error("Unauthorized");

            // Optional: only admins or same user can view
            if (!user?.isAdmin && user?.id !== userId) {
                throw new Error("Forbidden");
            }
            const todos = await Todo.find({ createdBy: userId }).sort({ createdAt: -1 }).exec();
            return todos;
        },

        todos: async (_, __, context) => {
            const user = context.user;
            if (user?.isAdmin) {
                return (await Todo.find().sort({ createdAt: -1 }).exec());
            }
            if (!user?.id) {
                return [];
            }
            const docs = await Todo.find({ createdBy: user.id }).sort({ createdAt: -1 }).exec();
            return docs;
        },

        todo : async (_, { id }, context) => {
            const user = context.user;
            if (!user?.id) {
                return null;
            }
            const res = await Todo.findById(id).exec();
            return res || null;
        },
        commentFeed: async () => {
            return await Comment.find().sort({ createdAt: -1 }).populate('author').exec();
        },
        myComments: async (_, __, context) => {
            const user = checkAuth(context);
            return await Comment.find({ author: user.id }).sort({ createdAt: -1 }).populate('author').exec();
        },
        allComments: async (_, __, context) => {
            const user = checkAuth(context);    
            if (!user.isAdmin) {
                throw new Error("Unauthorized — only admins can view all comments");
            }
            return await Comment.find().sort({ createdAt: -1 }).populate('author').exec();
        },
        products: async () => {
            return await Product.find().sort({ createdAt: -1 }).exec();
        },        
        product: async (_, { id }, context) => {
            return await Product.findById(id).exec();
            
        },
        reviewsByProduct: async (_, { productId }) => {
            return await Review.find({ product: productId }).sort({ createdAt: -1 }).populate('product').populate('user').exec();
        },
        cart: async (_, {  }, context) => {
            const user = checkAuth(context);
            let cart = await Cart.findOne({ user: user.id }).populate("user").populate('items.product').exec();
            if (!cart) {
                cart = new Cart({ user: user.id, items: [] });
                await cart.save();
            }
            return cart;          
        },
        cartItemByProductId: async (_, { productId }, context) => {
            const user = checkAuth(context);
            let cart = await Cart.findOne({ user: user.id }).populate("user").populate('items.product').exec();
            if (!cart) {
                return null;
            }
            const item = cart.items.find(item => String(item.product._id) === String(productId));
            return item || null;
        },
        bookmarks: async (_, __, context) => {
            const user = checkAuth(context);
            const bookmarks = await Bookmark.find({ user: user.id }).populate('product').populate('user').exec();
            return bookmarks;
        },
        bookmarksGroupedByUser: async (_, __, context) => {
            const user = checkAuth(context);
            if (!user.isAdmin) {
                throw new Error("Unauthorized — only admins can view bookmarks grouped by user");
            }
            const allBookmarks = await Bookmark.find().populate(['product', 'user']);
            const grouped = {};
            allBookmarks.forEach(bookmark => {
                const userId = bookmark.user._id.toString();
                if (!grouped[userId]) {
                    grouped[userId] = [];
                }
                grouped[userId].push(bookmark);
            });
            return Object.values(grouped);
        },

    },
    Mutation: {        
        login: async (_, { email, password }, context) => {
            const { ip, device } = context;
            const user = await User.findOne({ email: email.toLowerCase().trim() }).exec();
            if (!user) throw new Error('Invalid credentials');
            const ok = await bcrypt.compare(password, user.password);
            if (!ok) throw new Error('Invalid credentials');
            //fetch location from ip
            let location=null;
            let lat = null;
            let long = null;
            let suspicious = false;
            try{
                const res = await fetch(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_KEY}`);
                const data = await res.json();
                if (data.loc) {
                    [lat, long] = data.loc.split(',').map(Number);
                }
                location = `${data.city}, ${data.region}, ${data.country}`;                
                console.log('api data:', data);
            }catch(err){
                console.error("Failed to fetch location:", err.message);
            }
            // Save login metadata
            if(ip === "::1" || ip === "127.0.0.1"){
                location="Localhost";
                lat = 0;
                long = 0;
                suspicious = false;
            }
            //Detect suspicious login (different country)
            suspicious = user.lastLogin && location && user.lastLogin.location !== location &&user.lastLogin.device !== device;

            user.lastLogin = {
                ip,
                device,
                location,
                suspicious,
                lat,
                long,
                timestamp: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                }),
            };
            const token = generateToken(user);
            console.log("User login:", user.lastLogin);

            return { token, user: { id: user._id.toString(), email: user.email, isAdmin: user.isAdmin, lastLogin: user.lastLogin, } };
        },
        signup: async (_, { email, password, username, isAdmin = false }) => {
                email = email.toLowerCase().trim();
                const exists = await User.findOne({ email }).exec();
                if (exists) throw new Error('Email already registered');
                const hashed = await bcrypt.hash(password, 10);
                const user = new User({ email, password: hashed, username,  isAdmin });
                await user.save();
                const token = generateToken(user);
                return { token, user: { id: user._id.toString(), email: user.email, username: user.username, isAdmin: user.isAdmin,   } };
        },
        addTodo: async (_, { name, title, age, bio, company, experience, description,address }, context) => {
            const user = checkAuth(context);
            const todo = new Todo({ name, title, age, bio, company, experience, description,  address, createdBy: user.id,});
            return await todo.save();
        },
        
        updateTodo: async (_, { id, name, title, age, bio, company, experience, description, address }, context) => {
            const user = checkAuth(context); 
            const todo = await Todo.findById(id).exec();
            if (String(todo.createdBy) !== String(user.id) && !user.isAdmin) {
                throw new Error("Forbidden — you can only update your own todo");
            }
            const updates = {};
            if (name !== undefined) updates.name = name;
            if (title !== undefined) updates.title = title;
            if (age !== undefined) updates.age = age;
            if (bio !== undefined) updates.bio = bio;
            if (company !== undefined) updates.company = company;
            if (experience !== undefined) updates.experience = experience;
            if (description !== undefined) updates.description = description;
            if (address !== undefined) updates.address = address;
            return await Todo.findByIdAndUpdate(id, updates, { new: true });
        },
        deleteTodo: async (_, { id }, context) => {
            const user = checkAuth(context);
            const todo = await Todo.findById(id).exec();
            if (String(todo.createdBy) !== String(user.id) && !user.isAdmin) {
                throw new Error("Forbidden — you can only delete your own todo");
            }
            await Todo.findByIdAndDelete(id).exec();
            return true;
        },
        deleteUser: async (_, { id }, context) => {
            const user = checkAuth(context);
            if (!user.isAdmin) {
                throw new Error("Forbidden — only admins can delete users");
            }
            await Todo.deleteMany({ createdBy: id }).exec();
            await User.findByIdAndDelete(id).exec();            
            return true;    
        },
        addComment: async (_, { content }, context) => {
            const user = checkAuth(context);
            const comment = new Comment({ content, author: user.id });
            await comment.save();   
            return await comment.populate('author');
    },
    updateComment: async (_, { id, content }, context) => {
            const user = checkAuth(context);
            const comment = await Comment.findById(id).exec();
            if (!comment) throw new Error("Comment not found");
            const isAuthor = String(comment.author) === String(user.id);
            if (!isAuthor && !user.isAdmin) {
                throw new Error("Forbidden — you can only update your own comments");
            }
            comment.content = content;
            comment.updatedAt = new Date();
            await comment.save();
            return await comment.populate('author');
    },
        deleteComment: async (_, { id }, context) => {
            const user = checkAuth(context);
            const comment = await Comment.findById(id).exec();
            if (!comment) throw new Error("Comment not found");
            const isAuthor = String(comment.author) === String(user.id);
            if (!isAuthor && !user.isAdmin) {
                throw new Error("Forbidden — you can only delete your own comments");
            }
            await Comment.findByIdAndDelete(id).exec();
            return true;
    },
        addProduct: async (_, { name, price, description, image }, context) => {
            const user = checkAuth(context);
            if (!user.isAdmin) {
                throw new Error("Forbidden — only admins can add products");
            }
            const product = new Product({ name, price, description, image });
            return await product.save();
        },
        addToCart: async (_, { productId, quantity }, context) => {
            const user = checkAuth(context);
            let cart = await Cart.findOne({ user: user.id });
            if (!cart) cart = new Cart({ user: user.id, items: [] });
            const index = cart.items.findIndex(item => String(item.product) === String(productId));
            if (index > -1) {
                cart.items[index].quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity });
            }
            await cart.save();
            return  await Cart.findById(cart._id)
            .populate("items.product")
            .populate("user")
            .exec();
        },
           removeFromCart: async (_, { productId, quantity }, context) => {
            const user = checkAuth(context);
            let cart = await Cart.findOne({ user: user.id });
            if (!cart) cart = new Cart({ user: user.id, items: [] });
            const index = cart.items.findIndex(item => String(item.product) === String(productId));
            if (index > -1) {
                cart.items[index].quantity -= quantity;

                if (cart.items[index].quantity <= 0) {
                // Remove item if quantity is zero or negative
                cart.items.splice(index, 1);
                }
            }
            await cart.save();
            return  await Cart.findById(cart._id)
            .populate("items.product")
            .populate("user")
            .exec();
        },
        addBookmark: async (_, { productId }, context) => {
            const user = checkAuth(context);
            const existing = await Bookmark.findOne({
                user: user.id,
                product: productId,
            }).populate(['product', 'user']);
            if (existing) return existing;
            const bookmark = await Bookmark.create({
                product: productId,
                user: user.id,
            });
            await bookmark.populate([
                { path: 'product' },
                { path: 'user' }
            ]);
            return bookmark;
        },

        removeBookmark: async (_, { productId }, context) => {
            const user = checkAuth(context);
            const result = await Bookmark.findOneAndDelete({ user: user.id, product: productId }).exec();
            return result ? true : false;
        },
        addReview: async (_, { productId, rating, comment }, context) => {
            const user = checkAuth(context);
            const review = new Review({
                product: productId,
                user: user.id,
                rating,
                comment,
            });
            await review.save();
            await review.populate([{ path: 'product' }, { path: 'user' }]);
            return review;
        },
        updateReview: async (_, { id, rating, comment }, context) => {
            const user = checkAuth(context);
            const review = await Review.findById(id).exec();
            if (!review) throw new Error("Review not found");
            const isAuthor = String(review.user) === String(user.id);   
            if (!isAuthor && !user.isAdmin) {
                throw new Error("Forbidden — you can only update your own reviews");
            }
            if (rating !== undefined) review.rating = rating;
            if (comment !== undefined) review.comment = comment;
            review.updatedAt = new Date();
            await review.save();
            await review.populate([{ path: 'product' }, { path: 'user' }]);
            return review;
        },
        deleteReview: async (_, { id }, context) => {
            const user = checkAuth(context);
            const review = await Review.findById(id).exec();
            if (!review) throw new Error("Review not found");
            const isAuthor = String(review.user) === String(user.id);
            if (!isAuthor && !user.isAdmin) {
                throw new Error("Forbidden — you can only delete your own reviews");
            }
            await Review.findByIdAndDelete(id).exec();
            return true;
        },   

    },
    Product: {
        reviews: async (parent) => {
            return await Review.find({ product: parent.id })
                .populate("user")
                .sort({ createdAt: -1 })
                .exec();
        },

        reviewsCount: async (parent) => {
            return await Review.countDocuments({ product: parent.id });
        },
    },
};


export default resolvers;
