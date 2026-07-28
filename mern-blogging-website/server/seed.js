import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import User from "./models/User.js";
import Blog from "./models/Blog.js";

const seedDB = async () => {
    console.log("connecting DB");

    await mongoose.connect(process.env.DB_CONNECT, {
        autoIndex: true,
    });

    console.log("connected to DB");




    const user = await User.findOne({});

    if (!user) {
        console.log(
            "No users found! You must create an account on the frontend first.",
        );
        mongoose.disconnect();
        return;
    }

    console.log(`We will assign these blogs to: ${user.personal_info.username}`);

    // 3. Create our dummy blogs array
    // 3. Create our dummy blogs array (10 Blogs)
    const dummyBlogs = [
        {
            blog_id: "intro-to-buffer-overflows-" + Date.now() + "-1",
            title: "Intro to Buffer Overflows: A Beginner's Guide",
            des: "Understanding the basics of memory corruption and how buffer overflows occur in C programs.",
            tags: ["cybersecurity", "pwn", "ctf"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "Buffer overflows are one of the most classic vulnerabilities in computer security. When a program writes more data to a block of memory than it was allocated to hold, it overflows into adjacent memory...",
                    },
                },
            ],
        },
        {
            blog_id: "10-nmap-flags-" + Date.now() + "-2",
            title: "10 Nmap Flags Every Pentester Should Know",
            des: "A quick cheat sheet for mastering Nmap scans during your next penetration test.",
            tags: ["networking", "pentesting", "tools"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "Nmap is the undisputed king of network scanning. Before you start attacking a box, you need to know what ports are open. Here are 10 flags you absolutely must memorize...",
                    },
                },
            ],
        },
        {
            blog_id: "sql-injection-explained-" + Date.now() + "-3",
            title: "SQL Injection Explained with Real-World Examples",
            des: "How malicious inputs can ruin your database, and how to defend against them using parameterized queries.",
            tags: ["web-security", "sql", "owasp"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "Despite being decades old, SQL Injection (SQLi) remains a critical threat. Let's look at how an attacker can bypass authentication by simply injecting a ' OR 1=1 -- into a login field...",
                    },
                },
            ],
        },
        {
            blog_id: "getting-started-bug-bounty-" + Date.now() + "-4",
            title: "Getting Started in Bug Bounty Hunting",
            des: "My journey into bug bounties, the tools I use, and how to find your first valid bug.",
            tags: ["bug-bounty", "infosec", "hacking"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "Starting in bug bounties can feel overwhelming. You are competing against thousands of other hackers. But with the right methodology, finding your first bug is just a matter of time and persistence...",
                    },
                },
            ],
        },
        {
            blog_id: "htb-cyber-apocalypse-writeup-" + Date.now() + "-5",
            title: "HackTheBox Cyber Apocalypse 2024: Web Challenge Writeups",
            des: "Step-by-step solutions for the web exploitation challenges from the latest HTB CTF.",
            tags: ["ctf", "writeup", "hackthebox"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "The Cyber Apocalypse CTF was absolutely brutal this year. In this writeup, I'll walk you through how I solved the 'TimeKnot' web challenge by exploiting a subtle race condition...",
                    },
                },
            ],
        },
        {
            blog_id: "privilege-escalation-linux-" + Date.now() + "-6",
            title: "Linux Privilege Escalation Techniques",
            des: "From SUID binaries to misconfigured cron jobs: how to get root on a Linux box.",
            tags: ["linux", "privesc", "pentesting"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "You've got a reverse shell as the www-data user. Now what? The journey to the root user involves checking for misconfigurations. Always start by checking 'sudo -l' and looking for SUID binaries...",
                    },
                },
            ],
        },
        {
            blog_id: "wireshark-packet-analysis-" + Date.now() + "-7",
            title: "Deep Dive into Packet Analysis with Wireshark",
            des: "Learn how to read PCAP files and spot malicious traffic hiding in plain sight.",
            tags: ["networking", "forensics", "blueteam"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "Wireshark is an essential tool for both red and blue teams. Understanding how the TCP 3-way handshake works is critical when trying to diagnose if a network segment is under attack...",
                    },
                },
            ],
        },
        {
            blog_id: "xss-cross-site-scripting-" + Date.now() + "-8",
            title: "Reflected vs Stored XSS: What's the Difference?",
            des: "Breaking down Cross-Site Scripting vulnerabilities and how hackers steal session cookies.",
            tags: ["web-security", "xss", "frontend"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "Cross-Site Scripting occurs when an application includes untrusted data in a web page without proper validation. Stored XSS is much more dangerous because it affects anyone who views the infected page...",
                    },
                },
            ],
        },
        {
            blog_id: "reverse-engineering-malware-" + Date.now() + "-9",
            title: "Reverse Engineering a Ransomware Dropper",
            des: "Opening up a malicious executable in Ghidra and analyzing its behavior.",
            tags: ["malware", "reverse-engineering", "ghidra"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "Static analysis of malware can reveal a lot before you even execute it. We loaded the suspicious executable into Ghidra, and immediately noticed some obfuscated API calls being imported dynamically...",
                    },
                },
            ],
        },
        {
            blog_id: "securing-react-apps-" + Date.now() + "-10",
            title: "5 Tips for Securing Your React Applications",
            des: "Protect your frontend from XSS, CSRF, and prototype pollution attacks.",
            tags: ["react", "frontend", "security"],
            author: user._id,
            draft: false,
            content: [
                {
                    type: "paragraph",
                    data: {
                        text: "React is relatively secure by default because it automatically escapes strings before rendering them. However, using dangerouslySetInnerHTML can bypass this protection entirely if you aren't careful...",
                    },
                },
            ],
        },
    ];

    // 4. Insert the blogs into the database
    console.log("Inserting dummy blogs...");

    const insertedBlogs = await Blog.insertMany(dummyBlogs);
    console.log(`${insertedBlogs.length} blogs inserted!`);

    // 5. Update the user's account info
    // We push the new blog IDs into their profile so they show up on their dashboard
    insertedBlogs.forEach((blog) => {
        user.blogs.push(blog._id);
    });
    user.account_info.total_posts += insertedBlogs.length;
    await user.save();
    console.log("User profile updated!");

    // 6. Disconnect cleanly
    console.log("Seeding complete. Disconnecting...");
    mongoose.disconnect();
}
seedDB();