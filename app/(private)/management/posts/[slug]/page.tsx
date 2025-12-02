import { auth } from "@/auth";
import PrivateHeader from "@/components/layouts/PrivateHeader";

export const metadata = {
    title: "management Post Page",
};

type Params = {
    params: Promise<{slug: string}>
}

export default async function ManagementThePostPage({ params }: Params) {
    const { slug } = await params;
    const session = await auth();
    
    return (
        <div className="min-h-screen bg-app text-app font-mono">
            <PrivateHeader session={session} />
            <div className="space-y-4">
                 This postNumber is {slug}.
            </div>
        </div>    
    )
}
