import {SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
export let sb=null;
export async function initCloud(){if(!SUPABASE_URL||!SUPABASE_ANON_KEY)return null;const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});return sb}
export const user=async()=>sb?(await sb.auth.getUser()).data.user:null;
export const signUp=(e,p)=>sb.auth.signUp({email:e,password:p});
export const signIn=(e,p)=>sb.auth.signInWithPassword({email:e,password:p});
export const signOut=()=>sb.auth.signOut();
export const resetPw=e=>sb.auth.resetPasswordForEmail(e);
export async function cloudSave(w){const u=await user();if(!u)return false;const {error}=await sb.from('worlds').upsert({...w,user_id:u.id,last_played:new Date().toISOString()},{onConflict:'user_id,name'});if(error)throw error;return true}
export async function cloudLoad(name){const u=await user();if(!u)return null;const {data,error}=await sb.from('worlds').select('*').eq('name',name).maybeSingle();if(error)throw error;return data}
