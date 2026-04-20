import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";

dotenv.config({ quiet: true });

const SEED_USERS = [
  {
    clerkId: "seed_user_1",
    name: "Emma Watson",
    email: "emma@example.com",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    clerkId: "seed_user_2",
    name: "James Wilson",
    email: "james@example.com",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    clerkId: "seed_user_3",
    name: "Sophia Chen",
    email: "sophia@example.com",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    clerkId: "seed_user_4",
    name: "Michael Brown",
    email: "michael@example.com",
    avatar: "https://i.pravatar.cc/150?img=8",
  },
  {
    clerkId: "seed_user_5",
    name: "Olivia Martinez",
    email: "olivia@example.com",
    avatar: "https://i.pravatar.cc/150?img=9",
  },
  {
    clerkId: "seed_user_6",
    name: "William Taylor",
    email: "william@example.com",
    avatar: "https://i.pravatar.cc/150?img=11",
  },
  {
    clerkId: "seed_user_7",
    name: "Ava Johnson",
    email: "ava@example.com",
    avatar: "https://i.pravatar.cc/150?img=16",
  },
  {
    clerkId: "seed_user_8",
    name: "Benjamin Lee",
    email: "benjamin@example.com",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    clerkId: "seed_user_9",
    name: "Isabella Garcia",
    email: "isabella@example.com",
    avatar: "https://i.pravatar.cc/150?img=20",
  },
  {
    clerkId: "seed_user_10",
    name: "Ethan Davis",
    email: "ethan@example.com",
    avatar: "https://i.pravatar.cc/150?img=14",
  },
];

async function seed() {
  try {
    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(mongodbUri);
    console.log("Connected to MongoDB");

    if (process.env.NODE_ENV === "production") {
      throw new Error("Refusing to seed users in production");
    }

    const seedClerkIds = SEED_USERS.map((user) => user.clerkId);
    const seedEmails = SEED_USERS.map((user) => user.email.toLowerCase());

    // Delete old users
    await User.deleteMany({
      $or: [{ clerkId: { $in: seedClerkIds } }, { email: { $in: seedEmails } }],
    });
    console.log("Old seed users deleted!");

    // Insert seed users
    const users = await User.insertMany(SEED_USERS);
    console.log(`Seeded ${users.length} users`);
    users.forEach((user) => {
      console.log(` -${user.name} (${user.email})`);
    });

    await mongoose.disconnect();
    console.log("Done");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
