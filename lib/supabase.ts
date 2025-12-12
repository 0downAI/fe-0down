import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

    if (!url || !key) {
        console.error("Supabase credentials missing! Check .env file.")
    }

    return createBrowserClient(url!, key!)
}
