const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { userInfo } = require("os");
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // await client.connect();
    const database = client.db("smbazardb");
    const productsCollection = database.collection("products");
    const usersCollection = database.collection("users");
    const userInfosCollection = database.collection("userInfos");
    const bestClothesCollection = database.collection("bestClothes");
    const kidsClothesCollection = database.collection("kidsClothes");
    const mensClothesCollection = database.collection("mensClothes");
    const womensClothesCollection = database.collection("womensClothes");
    const ordersCollection = database.collection("orders");
    const reviewsCollection = database.collection("reviews");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("TRANSPORTER ERROR:", error);
      } else {
        // console.log("Email server is ready to send messages");
      }
    });

    // post Methode
    app.post("/signup", async (req, res) => {
      const { email, password } = req.body;
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      try {
        await usersCollection.updateOne(
          { email: email },
          { $set: { password, otp, otpExpires, isVerified: false } },
          { upsert: true },
        );

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Your Email Verification Code – AS WEAR CO.",
          html: `<div style="max-width:600px;margin:auto;padding:24px;font-family:Arial,sans-serif;background:#0f172a;border-radius:12px;border:1px solid #1f2937;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:20px;">
    <h2 style="margin:0;color:#facc15;">
      AS <span style="color:#fde047;">WEAR CO.</span>
    </h2>
    <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">
      Your Trusted Online Marketplace
    </p>
  </div>

  <!-- Body -->
  <p style="font-size:15px;color:#e5e7eb;line-height:1.6;">
    Hello,<br><br>
    Thank you for choosing <strong style="color:#facc15;">AS WEAR CO. Buy</strong>!
  </p>

  <p style="font-size:15px;color:#e5e7eb;">
    To complete your email verification, please use the One-Time Password (OTP) below:
  </p>

  <!-- OTP Box -->
  <div style="margin:26px 0;text-align:center;">
    <div style="
      display:inline-block;
      padding:8px 16px;
      background:#1f2937;
      color:#facc15;
      font-weight:600;
      border-radius:6px;
      margin-bottom:10px;
      font-size:14px;
      border:1px solid #374151;
    ">
      🔐 Your Verification Code
    </div>
    <br>
    <div style="
      display:inline-block;
      padding:14px 32px;
      font-size:26px;
      font-weight:bold;
      letter-spacing:4px;
      color:#0f172a;
      background:linear-gradient(90deg,#facc15,#fde047);
      border-radius:10px;
    ">
      ${otp}
    </div>
  </div>

  <p style="font-size:14px;color:#e5e7eb;">
    This code is valid for the next <strong style="color:#fde047;">10 minutes</strong>.<br>
    Please do not share this code with anyone for security reasons.
  </p>

  <p style="font-size:14px;color:#9ca3af;">
    If you did not request this verification, you can safely ignore this email — no further action is required.
  </p>

  <p style="font-size:15px;color:#e5e7eb;margin-top:22px;">
    We’re excited to have you with us and look forward to serving you!
  </p>

  <!-- Footer -->
  <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;">

  <p style="font-size:13px;color:#9ca3af;">
    Warm regards,<br>
    <strong style="color:#facc15;">AS WEAR CO. Team</strong>
  </p>

</div>
`,
        });

        res.status(200).send("OTP sent to your email!");
      } catch (error) {
        res.status(500).send("Error: " + error.message);
      }
    });

    app.post("/verify-otp", async (req, res) => {
      const { email, otp } = req.body;

      try {
        const user = await usersCollection.findOne({
          email: email,
          otp: otp,
          otpExpires: { $gt: new Date() },
        });

        if (!user) {
          return res.status(400).send("Invalid code or expired!");
        }

        await usersCollection.updateOne(
          { email: email },
          {
            $set: { isVerified: true },
            $unset: { otp: "", otpExpires: "" },
          },
        );

        res.status(200).send("Email verified successfully!");
      } catch (error) {
        res.status(500).send("Error: " + error.message);
      }
    });

    app.post("/bestclothes", async (req, res) => {
      const data = req.body;

      data.createdAt = new Date();

      const result = await bestClothesCollection.insertOne(data);
      res.send(result);
    });

    app.post("/kidsclothes", async (req, res) => {
      const product = req.body;
      product.createdAt = new Date();
      const result = await kidsClothesCollection.insertOne(product);
      res.send(result);
    });

    app.post("/mensclothes", async (req, res) => {
      const product = req.body;
      product.createdAt = new Date();
      const result = await mensClothesCollection.insertOne(product);
      res.send(result);
    });

    app.post("/womensclothes", async (req, res) => {
      const product = req.body;
      product.createdAt = new Date();
      const result = await womensClothesCollection.insertOne(product);
      res.send(result);
    });

    app.post("/userinfo", async (req, res) => {
      const user = req.body;
      const result = await userInfosCollection.insertOne(user);
      res.send(result);
    });

app.post("/order-confirm", async (req, res) => {
      try {
        const {
          userEmail,
          userName,
          cart,
          total,
          address,
          phone,
          paymentMethod,
          transactionId,
        } = req.body;
        const otp = crypto.randomInt(100000, 999999).toString();

        const productList = cart
          .map(
            (item) =>
              `<li>${item.title} × ${item.quantity} = ₹${
                item.after_discount_price * item.quantity
              }</li>`,
          )
          .join("");

        // 📩 USER MAIL
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: userEmail,
          subject: "🛒 Order Confirmed - AS WEAR CO.",
          html: `<div style="max-width:600px;margin:auto;padding:24px;font-family:Arial,sans-serif;background:#0f172a;border-radius:12px;border:1px solid #1f2937;color:#f9fafb;"> <!-- Header --> <div style="text-align:center;margin-bottom:20px;"> <h2 style="margin:0;color:#facc15;"> AS <span style="color:#fde047;">WEAR CO.</span> </h2> <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;"> Your Trusted Online Marketplace </p> </div> <!-- Greeting --> <p style="font-size:15px;color:#e5e7eb;line-height:1.6;"> Hello <strong>${userName}</strong>,<br><br> আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। নিচে সম্পূর্ণ অর্ডার তথ্য দেওয়া হলো: </p> <!-- Order Info --> <div style="background:#111827;padding:16px;border-radius:8px;margin:16px 0;"> <p style="margin:6px 0;font-size:14px;"><strong>Email:</strong> ${userEmail}</p> <p style="margin:6px 0;font-size:14px;"><strong>Phone:</strong> ${phone}</p> <p style="margin:6px 0;font-size:14px;"><strong>Delivery Address:</strong><br>${address}</p> <p style="margin:6px 0;font-size:14px;"><strong>Payment Method:</strong> ${paymentMethod}</p> <p style="margin:6px 0;font-size:14px;"><strong>Transaction ID:</strong> ${transactionId}</p> </div> <!-- Products --> <h3 style="margin-top:20px;color:#fde047;">🛒 Ordered Products</h3> <ul style="padding-left:18px;color:#e5e7eb;font-size:14px;line-height:1.6;"> ${productList} </ul> <!-- Total --> <div style="margin:20px 0;padding:14px;background:#1f2937;border-radius:8px;"> <p style="margin:0;font-size:16px;color:#facc15;"> <strong>Total Amount:</strong> ₹${total} </p> </div> <!-- Delivery Info --> <div style="margin:24px 0;padding:16px;background:#111827;border-left:4px solid #facc15;border-radius:6px;"> <p style="margin:0;font-size:14px;color:#e5e7eb;line-height:1.6;"> ⚠️ যদি আপনার <strong>Transaction ID</strong> সঠিক থাকে, তাহলে আপনার অর্ডার ২-৩ দিনের মধ্যে ডেলিভারি করা হবে।<br><br> ❌ যদি Transaction ID ভুল থাকে, তাহলে অর্ডারটি <strong>reject</strong> করা হবে এবং আপনি সেটি <strong>My Orders</strong> সেকশনে দেখতে পারবেন। </p> </div> <!-- Footer --> <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;"> <p style="font-size:13px;color:#9ca3af;text-align:center;"> ধন্যবাদ আমাদের সাথে থাকার জন্য।<br> <strong style="color:#facc15;">AS WEAR CO. Team</strong> </p> </div>
`,
        });

        const orderDoc = {
          userEmail,
          userName,
          phone,
          address,
          products: cart.map((item) => ({
            productId: item._id,
            title: item.title,
            quantity: item.quantity,
            price: item.after_discount_price,
          })),
          totalAmount: total,
          otp,
          status: "pending",
          createdAt: new Date(),
        };

        await ordersCollection.insertOne(orderDoc);

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // admin gmail
          subject: "📦 New Order Received - AS WEAR CO.",
          html: `<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;border-radius:8px">

  <h2 style="text-align:center;color:#2c3e50">
    🛒 New Order Received
  </h2>

  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">

  <h3 style="color:#34495e">👤 Customer Information</h3>
  <p><strong>Name:</strong> ${userName}</p>
  <p><strong>Email:</strong> ${userEmail}</p>
  <p><strong>Phone:</strong> ${phone}</p>

  <!-- NEW ADDED SECTION -->
  <p><strong>Payment Method:</strong> ${paymentMethod}</p>
  <p><strong>Transaction ID:</strong> ${transactionId}</p>

  <h3 style="color:#34495e;margin-top:20px">📍 Delivery Address</h3>
  <p>${address}</p>

  <h3 style="color:#34495e;margin-top:20px">📦 Ordered Products</h3>
  <ul style="padding-left:18px;line-height:1.6">
    ${productList}
  </ul>

  <h3 style="margin-top:20px;color:#27ae60">
    💰 Total Amount: ৳${total}
  </h3>

  <div style="margin-top:25px;padding:15px;background:#ffeaea;border:1px dashed red;border-radius:6px;text-align:center">
    <h2 style="color:red;margin:0">OTP: ${otp}</h2>
    <p style="margin:5px 0 0;font-size:13px;color:#555">
      এই OTP টি রাইডার অর্ডার হ্যান্ডওভারের সময় ভেরিফাই করবে
    </p>
  </div>

  <hr style="border:none;border-top:1px solid #ddd;margin:25px 0">

  <p style="font-size:12px;color:#777;text-align:center">
    This is an automated order notification email.<br>
    Please take necessary action.
  </p>

</div>
`,
        });

        res.send({ success: true });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false });
      }
    });


    app.post("/reviews", async (req, res) => {
      try {
        const review = req.body;
        const result = await reviewsCollection.insertOne(review);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create review" });
      }
    });

    // get methode

    app.get("/search", async (req, res) => {
      const query = req.query.q;

      if (!query) return res.send([]);

      const regex = new RegExp(query, "i");

      try {
        const best = await bestClothesCollection
          .find({ title: regex })
          .toArray();

        const kids = await kidsClothesCollection
          .find({ title: regex })
          .toArray();

        const mens = await mensClothesCollection
          .find({ title: regex })
          .toArray();

        const womens = await womensClothesCollection
          .find({ title: regex })
          .toArray();

        const results = [
          ...best.map((item) => ({ ...item, type: "bestclothes" })),
          ...kids.map((item) => ({ ...item, type: "kidsclothes" })),
          ...mens.map((item) => ({ ...item, type: "mensclothes" })),
          ...womens.map((item) => ({ ...item, type: "womensclothes" })),
        ];

        res.send(results);
      } catch (err) {
        res.status(500).send({ error: "Search failed" });
      }
    });

    app.get("/orders", async (req, res) => {
      try {
        const { email } = req.query;

        let query = {};
        if (email) {
          query = { userEmail: email };
        }

        const result = await ordersCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch orders" });
      }
    });
    app.get("/reviews", async (req, res) => {
      try {
        const { email } = req.query;

        let query = {};
        if (email) {
          query = { userEmail: email };
        }

        const result = await reviewsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });

    app.get("/userinfo/by-email/:email", async (req, res) => {
      try {
        const user = await userInfosCollection.findOne({
          email: req.params.email,
        });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get("/bestclothes", async (req, res) => {
      const result = await bestClothesCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();
      res.send(result);
    });

    app.get("/bestclothes/:id", async (req, res) => {
      const id = req.params.id;
      const bestclothes = await bestClothesCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(bestclothes);
    });

    app.get("/kidsclothes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await kidsClothesCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.get("/mensclothes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await mensClothesCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.get("/womensclothes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await womensClothesCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Kids Clothes Pagination
    app.get("/kidsclothes", async (req, res) => {
      try {
        let { page, limit = 10 } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        const total = await kidsClothesCollection.countDocuments();
        const result = await kidsClothesCollection
          .find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send({
          data: result,
          page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        });
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch kids clothes" });
      }
    });

    // Mens Clothes Pagination
    app.get("/mensclothes", async (req, res) => {
      try {
        let { page, limit = 10 } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        const total = await mensClothesCollection.countDocuments();
        const result = await mensClothesCollection
          .find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send({
          data: result,
          page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        });
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch mens clothes" });
      }
    });

    // Womens Clothes Pagination
    app.get("/womensclothes", async (req, res) => {
      try {
        let { page, limit = 10 } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        const total = await womensClothesCollection.countDocuments();
        const result = await womensClothesCollection
          .find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        res.send({
          data: result,
          page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        });
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch womens clothes" });
      }
    });

    //patch methode
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const product = req.body;
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: product },
      );
      res.send(result);
    });

    app.patch("/userinfo", async (req, res) => {
      try {
        const { email, phone, address } = req.body;

        const result = await userInfosCollection.updateOne(
          { email },
          {
            $set: {
              phone: phone,
              address: address,
            },
          },
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        res.json({
          success: true,
          message: "User updated successfully",
          result,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.patch("/orders/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;

        const order = await ordersCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!order) {
          return res.status(404).send({ message: "Order not found" });
        }

        await ordersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } },
        );

        // 🔥 Pending → Confirmed হলে stock কমবে
        if (order.status === "pending" && status === "confirmed") {
          const collections = [
            bestClothesCollection,
            kidsClothesCollection,
            mensClothesCollection,
            womensClothesCollection,
          ];

          for (const item of order.products) {
            for (const col of collections) {
              const product = await col.findOne({
                _id: new ObjectId(item.productId),
              });

              if (product) {
                const newStock = product.stock - item.quantity;

                if (newStock > 0) {
                  await col.updateOne(
                    { _id: new ObjectId(item.productId) },
                    { $set: { stock: newStock } },
                  );
                } else {
                  // stock 0 → delete
                  await col.deleteOne({
                    _id: new ObjectId(item.productId),
                  });
                }

                break;
              }
            }
          }
        }

        res.send({ success: true });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to update order" });
      }
    });
    app.patch("/reviews/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { rating, comment } = req.body;

        const result = await reviewsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: { rating, comment },
          },
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update order" });
      }
    });

    app.patch("/kidsclothes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await kidsClothesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );

        res.send({
          success: true,
          message: "Product updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Update failed",
          error,
        });
      }
    });

    app.patch("/mensclothes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await mensClothesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );

        res.send({
          success: true,
          message: "Product updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Update failed",
          error,
        });
      }
    });

    app.patch("/womensclothes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await womensClothesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );

        res.send({
          success: true,
          message: "Product updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Update failed",
          error,
        });
      }
    });

    app.patch("/bestclothes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await bestClothesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );

        res.send({
          success: true,
          message: "Product updated successfully",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Update failed",
          error,
        });
      }
    });
    //delete methode
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.delete("/products", async (req, res) => {
      const result = await productsCollection.deleteMany({});
      res.send(result);
    });

    app.delete("/kidsclothes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await kidsClothesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.delete("/mensclothes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await mensClothesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.delete("/womensclothes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await womensClothesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.delete("/bestclothes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bestClothesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const result = await reviewsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});