import { auth } from "@/auth";
import CreatePost from "@/components/CreatePost";
import PrivateHeader from "@/components/layouts/PrivateHeader";

export const metadata = {
    title: "management Create Posts",
};

export default async function CreatePostPage() {
    const session = await auth();

    return (
        <div className="min-h-screen bg-app text-app font-mono">
            <PrivateHeader session={session} />
            <div className="space-y-4">
                <CreatePost />
            </div>
        </div>
    )
}
