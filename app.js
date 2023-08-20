import express from "express";
import path from "path";
import mongoose, { Schema, set } from "mongoose";
import { render } from "ejs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { url } from "inspector";
import { error } from "console";

import schedule from "node-schedule";
mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "flipkart",
  })
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  userId: Number,
  name: String,
  email: String,
  password: String,
  phoneno: Number,
  address: String,
  walletId: String,
});
const cartSchema = new mongoose.Schema({
  userId: Number,
  productId: Number,
  productname: String,
  price: Number,
  qunatity: Number,
});
const productSchema = new mongoose.Schema({
  productId: Number,
  productname: String,
  price: Number,
  qunatity: Number,
  productimage: String,
});
const transactionSchema = new mongoose.Schema({
  userId: Number,
  productname: String,
  date: String,
  noOfToken: Number,
});

const tokenSchema = new mongoose.Schema({
  userId: Number,
  token: Number,
  receivedtoken: Number,
  date: Date,
});

const User = mongoose.model("User", userSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Product = mongoose.model("Product", productSchema);
const Transx = mongoose.model("Transx", transactionSchema);
const Token = mongoose.model("Token", tokenSchema);

const app = express();
//using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//setting up view engine
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decode = jwt.verify(token, "azwxynorsq");

    req.user = await User.findById(decode._id);
    next();
  } else {
    res.render("login");
  }
};

async function depreciateToken() {
  try {
    const thresholdDate = new Date();
    const date = await Token.find({ date: { $lt: thresholdDate } });

    for (const user of date) {
      await User.findByIdAndUpdate(user._id, { $inc: { token: -0.01 } });
    }

    console.log("Token values depreciated.");
  } catch (error) {
    console.error("Error depreciating tokens:", error);
  }
}
schedule.scheduleJob("0 0 * * *", depreciateToken);

app.get("/", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });

  res.render("home", { token });
});
app.get("/home", (req, res) => {
  res.redirect("/");
  // res.render("login");
});

app.get("/login", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });

  res.render("login", { token });
});

app.get("/profile", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });

  res.render("profile", { token });
});

app.get("/shop", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });

  res.render("shop", { token });
});

app.get("/blog", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });

  res.render("blog", { token });
});

app.get("/about", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });

  res.render("about", { token });
});
app.get("/reward", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });
  let item = await Transx.find({ userId: 1 });

  res.render("reward", { token, item });
});

app.get("/contact", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });

  res.render("contact", { token });
});

app.get("/register", async (req, res) => {
  let token = await Token.findOne({ userId: 1 });

  res.render("register", { token });
});

app.get("/cart", async (req, res) => {
  const item = await Cart.find();
  let token = await Token.findOne({ userId: 1 });

  const totalPrice = item.reduce((total, item) => total + item.price, 0);
  res.render("cart", { item, totalPrice, token });
});
app.get("/user", async (req, res) => {
  let user = await User.findOne({ email: "aloksulya44@gmail.com" });
  let token = await Token.findOne({ userId: 1 });

  res.render("user", { user, token });
});
app.get("/rewardshop", async (req, res) => {
  // let token = await Token.findOne({ userId: 1 });

  res.render("rewardshop", {});
});

app.post("/cart", async (req, res) => {
  try {
    let totalPrice;

    const history = await Cart.find();
    // console.log(history);
    let price = 0;
    if (history != null) {
      totalPrice = await Cart.aggregate([
        {
          $group: {
            _id: null,
            totalquantity: { $sum: "$price" },
          },
        },
      ]);
      price = totalPrice[0].totalquantity;
    }

    let countTokens = Math.floor(price / 50);
    let token = await Token.find({ userId: 1 });
    let totaltokens = token[0].token + countTokens;

    console.log(price);
    console.log(countTokens);
    console.log(token);
    console.log(totaltokens);

    const myDate = new Date();
    await Token.updateOne({ userId: 1 }, { $set: { token: totaltokens } });
    let i = 0;
    while (history[i]) {
      let data = {
        userId: history[i].userId,
        productname: history[i].productname,
        date: myDate,
        noOfToken: countTokens,
        receivedtoken: price,
      };
      await Transx.insertMany([data]);
      i++;
    }

    await Cart.deleteMany();

    res.redirect("/cart");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/connect-metamask", async (req, res) => {
  const receivedData = req.body.data;

  await User.updateOne(
    { name: "Alok Sulya" },
    { $set: { walletId: receivedData } }
  );
});

app.post("/p1", async (req, res) => {
  try {
    const product = {
      userId: 1,
      productId: 101,
      productname: "Cartoon T-shirt",
      price: 100,
      qunatity: 1,
    };

    await Cart.insertMany([product]);

    res.redirect("/shop");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/p2", async (req, res) => {
  try {
    const product = {
      productId: 102,
      productname: "Cartoon T-shirt",
      price: 150,
      qunatity: 1,
    };
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/p3", async (req, res) => {
  try {
    const product = {
      productId: 103,
      productname: "Cartoon T-shirt",
      price: 200,
      qunatity: 1,
    };
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });
  if (!user) {
    return res.redirect("/register");
  } else {
    if (user.password != password) return res.redirect("/login");
  }

  const token = jwt.sign({ _id: user._id }, "azwxynorsq");

  res.cookie("token", token, {
    httpOnly: true,
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password, phoneno, address } = req.body;

  const user = {
    name,
    email,
    password,
    phoneno,
    address,
    userId: 1,
    walletId: null,
  };
  const myDate = new Date();
  const tok = {
    userId: 1,
    token: 0,
    date: myDate,
  };

  await User.insertMany([user]);
  await Token.insertMany([tok]);

  res.redirect("/login");
});

app.listen(5000, () => {
  console.log("server is running using express js to port 5000");
});
