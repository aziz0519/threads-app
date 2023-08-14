"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import { connectToDB } from "../mongoose"
import User from "../models/user.model"
import Community from "../models/community.model";


interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string
}

export async function createThread({ text, author, communityId, path }: Params) {
    try {
    
    connectToDB();

    const communityIdObject = await Community.findOne(
        { id: communityId },
        { _id: 1 }
    );

    const createdThread = await Thread.create({
        text,
        author,
        community: communityIdObject,
    });

    // Update user model
    await User.findByIdAndUpdate(author, {
        $push: { threads: createdThread._id }
    })

    if (communityIdObject) {
        // Update Community Model
        await Community.findByIdAndUpdate(communityIdObject, {
            $push: { threads: createdThread._id },
        })
    }

    revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Failed to create thread: ${error.message}`);

    } 
} 

export async function fetchPosts( pageNumber = 1, pageSize=20) {
    connectToDB();

    // Calculate the number of posts to skip
    const skipAmount = (pageNumber - 1)* pageSize;

    // Fetch post that have no parents

    const postsQuery = Thread.find({ parentId: { $in: [null, undefined]}})
        .sort({ createdAt: 'desc' })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({ 
            path: 'author', 
            model: User})
        .populate({
            path: 'community',
            model: Community,
            select: "_id name parentId image"
        })
        .populate({
            path: "children",
            populate: {
                path: "author",
                model: User,
                select: "_id name parentId image"
            },
        })

        const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined]}, 
        })

        const posts = await postsQuery.exec();

        const isNext = totalPostsCount > skipAmount + posts.length;

        return { posts, isNext }
        
}

export async function fetchThreadById(id: string) {
    connectToDB();

    try {
        // TO DO; fetch community
        const thread = await Thread.findById(id)
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            })
            .populate({
                path: "community",
                model: Community,
                select: "_id id name image",
            })
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author',
                        model: User,
                        select: "_id id name parentId image"
                    },
                    {
                        path:'children',
                        model: Thread,
                        populate: {
                            path: 'author',
                            model: User,
                            select: "_id id name parentId image"
                        },
                    },
                ],
            }
            ).exec();

            return thread;
    } catch (error: any) {
        throw new Error(`Error fecthing thread: ${error.message}`)

    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) {
    connectToDB();

    try {
        // Find original thread by ID
        const originalThread = await Thread.findById(threadId);

        if (!originalThread) {
            throw new Error("Thread no Found")
        }

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId, // Set the parentId to the original thread's ID
        })
        
        const savedCommentThread = await commentThread.save();


        originalThread.children.push(savedCommentThread._id)

        await originalThread.save()

        revalidatePath(path);
        
    } catch (err) {
        console.error("Error while adding comment:", err);
        throw new Error("Unable to add comment")
    }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
    const childThreads = await Thread.find({ parentId: threadId });

    const descendantThreads = [];
    for (const childThread of childThreads) {
        const descendants = await fetchAllChildThreads(childThread._id);
        descendantThreads.push(childThread, ...descendants)
    }

    return descendantThreads;
}


export async function deleteThread(id: string, path: string): Promise<void> {
    try {
        connectToDB()

        const mainThread = await Thread.findById(id).populate("author community")

        if (!mainThread) {
            throw new Error("Thread not found")
        }

        const descendantThreads = await fetchAllChildThreads(id);

        const descendantThreadIds = [
            id,
            ...descendantThreads.map((thread) => thread._id),
        ];

        const uniqueAuthorIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.author?._id?.toString()),
                mainThread.author?._id?.toString(),
             ].filter((id) => id !== undefined)
        )

        const uniqueCommunityIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.author?._id?.toString()),
                mainThread.community?._id?.toString(),
            ].filter((id) => id !== undefined)
        )

        await Thread.deleteMany({ _id: { $in: descendantThreadIds }})

        await User.updateMany(
            { _id: { $in: Array.from(uniqueAuthorIds)}},
            { $pull: { threads: { $in: descendantThreadIds }}}
        );

    } catch (error: any) {
        throw new Error(`Failed to delete thread ${error.message}`)
    }
}