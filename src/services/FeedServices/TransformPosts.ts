export default function transformPosts(posts: any[]): any[] {
    const tranPosts = posts.map((p: any) => p.toJSON ? p.toJSON() : p);

    tranPosts.forEach((post: any) => {
        // Parse contens if it's a string
        if (typeof post.contens === 'string') {
            try {
                post.contens = JSON.parse(post.contens);
                // Double parse if needed
                if (typeof post.contens === 'string') {
                    post.contens = JSON.parse(post.contens);
                }
            } catch (e) {
                console.warn('Failed to parse contens:', e);
            }
        }

        // Ensure contens has correct structure
        if (post.contens && typeof post.contens === 'object') {
            post.contens = {
                text: post.contens.text || '',
                image: post.contens.image || []
            };
        }
    });

    return tranPosts;
}