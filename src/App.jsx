import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase.js';
import {
  userStats, groupStats, calcPostPoints, msUntilNextPost,
  fmtCountdown, fmtTime, generateJoinCode, matchScore
} from './stats.js';

const MAX_GROUPS_PER_USER = 3;
const ACCENT = '#3b82f6';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
const REACTION_EMOJIS = ['👍', '😂', '🔥', '💀', '🤡', '😮', '❤️'];

const Icon = {
  Camera: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
  ),
  Bell: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  ),
  LogOut: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  ),
  Flame: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
  ),
  Star: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  Trophy: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
  ),
  Users: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Warning: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
  ),
  Zap: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  ),
  Search: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
  ),
  UserPlus: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
  ),
  Check: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  X: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
};

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [posts, setPosts] = useState([]);
  const [reactions, setReactions] = useState([]); // [{post_id, user_id, emoji}]
  const [openReactionPost, setOpenReactionPost] = useState(null); // post id whose reaction picker is open
  const [groups, setGroups] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [tick, setTick] = useState(0);
  const [camStream, setCamStream] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', groupName: '', joinCode: '' });
  const [authMode, setAuthMode] = useState('login');
  const [tab, setTab] = useState('feed');
  const [feedMode, setFeedMode] = useState('groups'); // 'groups' | 'friends'
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [friendships, setFriendships] = useState([]);
  const [matches, setMatches] = useState([]); // competitive matches // [{id, requester_id, addressee_id, status}]
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendSearching, setFriendSearching] = useState(false); // user id whose profile is being viewed
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id); else setScreen('login');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id); else { setProfile(null); setScreen('login'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (p) { setProfile(p); await loadAll(userId); setScreen('home'); }
    else setScreen('setup-name');
  }

  async function loadAll(userId) {
    const { data: myMems } = await supabase.from('group_members').select('*').eq('user_id', userId);
    const myGroupIds = (myMems || []).map(m => m.group_id);
    let myGroups = [];
    if (myGroupIds.length > 0) {
      const { data } = await supabase.from('groups').select('*, created_by').in('id', myGroupIds);
      myGroups = data || [];
    }
    setGroups(myGroups);
    if (myGroups.length > 0 && !activeGroupId) setActiveGroupId(myGroups[0].id);
    let allMems = [];
    if (myGroupIds.length > 0) {
      const { data } = await supabase.from('group_members').select('*').in('group_id', myGroupIds);
      allMems = data || [];
    }
    setMemberships(allMems);
    const memberIds = [...new Set(allMems.map(m => m.user_id))];
    if (memberIds.length > 0) {
      const { data } = await supabase.from('profiles').select('*').in('id', memberIds);
      const map = {};
      (data || []).forEach(p => { map[p.id] = p; });
      setProfiles(map);
    }
    // Always include own user ID so their posts show even if not in a group
    const postUserIds = [...new Set([...memberIds, userId])];

    if (postUserIds.length > 0) {
      const { data } = await supabase.from('posts').select('*').in('user_id', postUserIds).order('created_at', { ascending: false });
      const postsList = (data || []).map(p => ({ id: p.id, userId: p.user_id, userName: p.user_name, ts: new Date(p.created_at).getTime(), img: p.image_url, points: p.points || 2 }));
      setPosts(postsList);
      const postIds = postsList.map(p => p.id);
      if (postIds.length > 0) {
        const { data: rxs } = await supabase.from('reactions').select('*').in('post_id', postIds);
        setReactions(rxs || []);
      } else {
        setReactions([]);
      }
    } else { setPosts([]); setReactions([]); }

    // Load friendships
    const { data: fs } = await supabase.from('friendships').select('*').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    const fsList = fs || [];
    setFriendships(fsList);

    // Load matches involving user's groups
    if (myGroupIds.length > 0) {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(myGroupIds.map(id => `group_a_id.eq.${id},group_b_id.eq.${id}`).join(','))
        .order('created_at', { ascending: false });
      setMatches(matchData || []);
    } else {
      setMatches([]);
    }

    // Load accepted friends' profiles and last-24h posts (for friends feed)
    const acceptedFriendIds = fsList
      .filter(f => f.status === 'accepted')
      .map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);

    const allUserIds = [...new Set([...memberIds, ...acceptedFriendIds])];

    // Load any missing friend profiles
    const missingIds = acceptedFriendIds.filter(id => !memberIds.includes(id));
    if (missingIds.length > 0) {
      const { data: friendProfiles } = await supabase.from('profiles').select('*').in('id', missingIds);
      setProfiles(prev => {
        const map = { ...prev };
        (friendProfiles || []).forEach(p => { map[p.id] = p; });
        return map;
      });
    }

    // Load friends' posts from last 24h that aren't already in the group feed
    const since24h = new Date(Date.now() - 86400000).toISOString();
    if (acceptedFriendIds.length > 0) {
      const { data: friendPosts } = await supabase
        .from('posts').select('*')
        .in('user_id', acceptedFriendIds)
        .gte('created_at', since24h)
        .order('created_at', { ascending: false });
      const friendPostsMapped = (friendPosts || []).map(p => ({ id: p.id, userId: p.user_id, userName: p.user_name, ts: new Date(p.created_at).getTime(), img: p.image_url, points: p.points || 2 }));
      // Merge with existing posts (avoid duplicates)
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newOnes = friendPostsMapped.filter(p => !existingIds.has(p.id));
        return [...prev, ...newOnes].sort((a, b) => b.ts - a.ts);
      });
      // Load reactions for friend posts too
      const friendPostIds = friendPostsMapped.map(p => p.id);
      if (friendPostIds.length > 0) {
        const { data: friendRxs } = await supabase.from('reactions').select('*').in('post_id', friendPostIds);
        setReactions(prev => {
          const existingPostIds = new Set(prev.map(r => r.post_id));
          const newRxs = (friendRxs || []).filter(r => !existingPostIds.has(r.post_id));
          return [...prev, ...newRxs];
        });
      }
    }
  }

  useEffect(() => {
    if (!session) return;
    const ch = supabase.channel('all-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadAll(session.user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => loadAll(session.user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => loadAll(session.user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => loadAll(session.user.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => loadAll(session.user.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session]);

  useEffect(() => { if (screen === 'camera' && videoRef.current && camStream) videoRef.current.srcObject = camStream; }, [screen, camStream]);

  async function register() {
    setErr('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return setErr("Fill everything in, mate.");
    if (form.password.length < 6) return setErr("Password needs 6+ characters.");
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (error) return setErr(error.message);
    if (data.user) {
      const { error: pErr } = await supabase.from('profiles').insert({ id: data.user.id, name: form.name });
      if (pErr) return setErr(pErr.message);
    }
  }
  async function login() {
    setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) return setErr(error.message);
  }
  async function setupName() {
    setErr('');
    if (!form.name.trim()) return setErr('Need a name.');
    const { error } = await supabase.from('profiles').insert({ id: session.user.id, name: form.name });
    if (error) return setErr(error.message);
    await loadProfile(session.user.id);
  }
  async function logout() { await supabase.auth.signOut(); }

  async function createGroup() {
    setErr(''); setInfo('');
    if (!form.groupName.trim()) return setErr('Give it a name.');
    if (groups.length >= MAX_GROUPS_PER_USER) return setErr(`Max ${MAX_GROUPS_PER_USER} groups per person.`);
    const code = generateJoinCode();
    const { data: g, error } = await supabase.from('groups').insert({ name: form.groupName, join_code: code, created_by: session.user.id }).select().single();
    if (error) return setErr(error.message);
    const { error: mErr } = await supabase.from('group_members').insert({ group_id: g.id, user_id: session.user.id });
    if (mErr) return setErr(mErr.message);
    setForm(f => ({ ...f, groupName: '' }));
    setInfo(`Group created! Share code: ${code}`);
    await loadAll(session.user.id);
  }
  async function joinGroup() {
    setErr(''); setInfo('');
    if (!form.joinCode.trim()) return setErr('Paste a join code.');
    if (groups.length >= MAX_GROUPS_PER_USER) return setErr(`Max ${MAX_GROUPS_PER_USER} groups per person.`);
    const code = form.joinCode.toUpperCase().trim();
    const { data: g, error } = await supabase.from('groups').select('*').eq('join_code', code).single();
    if (error || !g) return setErr('No group with that code.');
    if (groups.find(x => x.id === g.id)) return setErr("You're already in that group.");
    const { error: mErr } = await supabase.from('group_members').insert({ group_id: g.id, user_id: session.user.id });
    if (mErr) return setErr(mErr.message);
    setForm(f => ({ ...f, joinCode: '' }));
    setInfo(`Joined ${g.name}!`);
    await loadAll(session.user.id);
  }
  async function leaveGroup(groupId) {
    if (!confirm('Leave this group?')) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', session.user.id);
    if (activeGroupId === groupId) setActiveGroupId(null);
    await loadAll(session.user.id);
  }

  async function openCamera() {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setCamStream(stream); setCaptured(null); setScreen('camera');
    } catch { setErr("Couldn't access camera. Check permissions."); }
  }
  function stopCamera() { if (camStream) camStream.getTracks().forEach(t => t.stop()); setCamStream(null); }
  function snap() {
    const v = videoRef.current; const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(blob => setCaptured(blob), 'image/jpeg', 0.85);
    stopCamera();
  }
  function retake() { setCaptured(null); openCamera(); }
  function cancelCamera() { stopCamera(); setCaptured(null); setScreen('home'); }

  async function postSelfie() {
    if (!captured || !profile) return;
    setPosting(true); setErr('');
    try {
      const myPosts = posts.filter(p => p.userId === profile.id);
      const points = calcPostPoints(myPosts);
      const fileName = `${profile.id}/${Date.now()}.jpg`;

      // Step 1: Upload photo
      const { error: upErr } = await supabase.storage.from('selfies').upload(fileName, captured, { contentType: 'image/jpeg' });
      if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);

      // Step 2: Get public URL
      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);

      // Step 3: Save post to database
      const { error: insErr } = await supabase.from('posts').insert({
        user_id: profile.id,
        user_name: profile.name,
        image_url: publicUrl,
        points
      });
      if (insErr) throw new Error(`Saving post failed: ${insErr.message}`);

      // All good — go home immediately
      setCaptured(null);
      setPosting(false);
      setScreen('home');
      loadAll(profile.id);
    } catch (e) {
      setErr(e.message || 'Something went wrong — try again');
      setPosting(false);
    }
  }

  async function toggleReaction(postId, emoji) {
    if (!profile) return;
    const existing = reactions.find(r => r.post_id === postId && r.user_id === profile.id);
    if (existing && existing.emoji === emoji) {
      await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', profile.id);
    } else if (existing) {
      await supabase.from('reactions').update({ emoji }).eq('post_id', postId).eq('user_id', profile.id);
    } else {
      await supabase.from('reactions').insert({ post_id: postId, user_id: profile.id, emoji });
    }
    setOpenReactionPost(null);
    if (profile) await loadAll(profile.id);
  }

  async function searchFriends(query) {
    if (!query.trim() || query.length < 2) { setFriendSearchResults([]); return; }
    setFriendSearching(true);
    try {
      // Search by name or email (case insensitive)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${query}%`)
        .neq('id', profile.id)
        .limit(10);
      // Also try email match via auth — search profiles by id if email matches
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('id, name')
        .limit(0); // placeholder — we'll match via auth below

      setFriendSearchResults(data || []);
    } catch { setFriendSearchResults([]); }
    finally { setFriendSearching(false); }
  }

  async function sendFriendRequest(addresseeId) {
    if (!profile) return;
    await supabase.from('friendships').insert({
      requester_id: profile.id, addressee_id: addresseeId, status: 'pending'
    });
    await loadAll(profile.id);
  }

  async function respondToRequest(friendshipId, accept) {
    await supabase.from('friendships').update({
      status: accept ? 'accepted' : 'declined',
      updated_at: new Date().toISOString()
    }).eq('id', friendshipId);
    await loadAll(profile.id);
  }

  async function removeFriend(friendshipId) {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await loadAll(profile.id);
  }

  // ── Match actions
  async function submitGroupToLobby(groupId) {
    if (!profile) return;
    // Check group isn't already in an active/waiting match
    const existing = matches.find(m =>
      (m.group_a_id === groupId || m.group_b_id === groupId) &&
      (m.status === 'waiting' || m.status === 'active')
    );
    if (existing) return;

    // Check for a waiting match to join
    const { data: waiting } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'waiting')
      .neq('group_a_id', groupId)
      .limit(1)
      .single();

    if (waiting) {
      // Join this match
      const now = new Date().toISOString();
      const ends = new Date(Date.now() + 14 * 86400000).toISOString();
      await supabase.from('matches').update({
        group_b_id: groupId,
        submitted_by_b: profile.id,
        status: 'active',
        started_at: now,
        ends_at: ends,
      }).eq('id', waiting.id);
    } else {
      // Create new waiting match
      await supabase.from('matches').insert({
        group_a_id: groupId,
        submitted_by_a: profile.id,
        status: 'waiting',
      });
    }
    await loadAll(profile.id);
  }

  async function withdrawFromLobby(matchId) {
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if (error) { console.error('Withdraw error:', error.message); return; }
    await loadAll(profile.id);
  }

  // Derived friendship helpers
  function getFriendshipStatus(otherId) {
    const fs = friendships.find(f =>
      (f.requester_id === profile?.id && f.addressee_id === otherId) ||
      (f.addressee_id === profile?.id && f.requester_id === otherId)
    );
    if (!fs) return null;
    return { ...fs, iAmRequester: fs.requester_id === profile?.id };
  }

  const pendingIncoming = friendships.filter(f =>
    f.addressee_id === profile?.id && f.status === 'pending'
  );

  const myPosts = profile ? posts.filter(p => p.userId === profile.id) : [];
  const timeLeft = msUntilNextPost(myPosts);
  const canPost = timeLeft === 0;
  const myStats = profile ? userStats(myPosts) : null;
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const activeGroupMemberIds = activeGroup ? memberships.filter(m => m.group_id === activeGroup.id).map(m => m.user_id) : [];
  const activeGroupMembers = activeGroupMemberIds.map(id => ({
    id, profile: profiles[id], stats: userStats(posts.filter(p => p.userId === id))
  })).sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);

  const s = {
    app: { minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: FONT, paddingBottom: '76px' },
    header: { background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
    logo: { fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' },
    badge: { color: ACCENT },
    btn: { background: ACCENT, color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: '8px' },
    input: { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '13px 16px', fontSize: '15px', color: '#f0f0f0', width: '100%', outline: 'none', fontFamily: FONT, boxSizing: 'border-box' },
    card: { background: '#111', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px', border: '1px solid #1a1a1a' },
    err: { color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '8px' },
    tab: (active) => ({ flex: 1, padding: '11px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: '600', fontSize: '13px', background: active ? ACCENT : 'transparent', color: active ? '#fff' : '#666' }),
    iconBtn: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888' },
  };

  const Logo = ({ size = 56 }) => (
    <div style={{ width: size, height: size, background: '#1a1a2e', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <Icon.Camera size={size * 0.5} color={ACCENT} />
    </div>
  );

  if (screen === 'splash') return (
    <div style={{ ...s.app, paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '24px', color: ACCENT }}>Loading...</div>
    </div>
  );

  if (screen === 'camera') return (
    <div style={{ ...s.app, paddingBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700' }}>Strike a pose, Dad</div>
      {!captured ? (
        <>
          <div style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', overflow: 'hidden', background: '#111', aspectRatio: '1' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={s.btn} onClick={snap}><Icon.Camera size={16} /> Snap</button>
            <button style={{ ...s.btn, background: '#1a1a1a', color: '#aaa' }} onClick={cancelCamera}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', overflow: 'hidden', aspectRatio: '1' }}>
            <img src={URL.createObjectURL(captured)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button style={s.btn} onClick={postSelfie} disabled={posting}>{posting ? 'Posting...' : 'Post it'}</button>
            <button style={{ ...s.btn, background: '#1a1a1a', color: '#aaa' }} onClick={retake}>Retake</button>
            <button style={{ ...s.btn, background: '#1a1a1a', color: '#aaa' }} onClick={cancelCamera}>Cancel</button>
          </div>
          {err && <div style={s.err}>{err}</div>}
        </>
      )}
    </div>
  );

  if (screen === 'setup-name') return (
    <div style={{ ...s.app, paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>What should we call you?</div>
        </div>
        <input style={s.input} placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <button style={{ ...s.btn, width: '100%', padding: '14px', marginTop: '12px', justifyContent: 'center' }} onClick={setupName}>Continue</button>
        {err && <div style={s.err}>{err}</div>}
      </div>
    </div>
  );

  if (screen === 'login') {
    const isReg = authMode === 'register';
    return (
      <div style={{ ...s.app, paddingBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ marginBottom: '16px' }}><Logo size={64} /></div>
            <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px' }}>Dad<span style={s.badge}>Shot</span></div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '6px' }}>Daily selfies. No excuses.</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: '#111', borderRadius: '12px', padding: '4px' }}>
            <button onClick={() => { setAuthMode('login'); setErr(''); }} style={s.tab(authMode === 'login')}>Log in</button>
            <button onClick={() => { setAuthMode('register'); setErr(''); }} style={s.tab(authMode === 'register')}>Sign up</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isReg && <input style={s.input} placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />}
            <input style={s.input} placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input style={s.input} placeholder="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <button style={{ ...s.btn, width: '100%', padding: '14px', justifyContent: 'center' }} onClick={isReg ? register : login}>
              {isReg ? 'Create account' : 'Log in'}
            </button>
            {err && <div style={s.err}>{err}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logo}>Dad<span style={s.badge}>Shot</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {myStats?.isRelegated && (
            <span style={{ fontSize: '11px', background: '#3a0f0f', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '20px', padding: '4px 10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon.Warning size={12} /> RELEGATED
            </span>
          )}
          <button style={s.iconBtn}><Icon.Bell size={16} /></button>
          <button style={{ ...s.iconBtn, position: 'relative' }} onClick={() => setShowFriendSearch(true)}>
            <Icon.UserPlus size={16} />
            {pendingIncoming.length > 0 && (
              <span style={{ position: 'absolute', top: '-3px', right: '-3px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '14px', height: '14px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                {pendingIncoming.length}
              </span>
            )}
          </button>
          <span style={{ fontSize: '13px', color: '#888' }}>{profile?.name}</span>
          <button style={s.iconBtn} onClick={logout}><Icon.LogOut size={14} /></button>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        {groups.length > 0 && feedMode === 'groups' && tab === 'feed' && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
            {groups.map(g => (
              <button key={g.id} onClick={() => setActiveGroupId(g.id)} style={{
                background: activeGroupId === g.id ? ACCENT : '#141414',
                color: activeGroupId === g.id ? '#fff' : '#888',
                border: '1px solid ' + (activeGroupId === g.id ? ACCENT : '#2a2a2a'),
                borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: FONT
              }}>{g.name}</button>
            ))}
          </div>
        )}

        <div style={{ background: '#0d1424', border: `1px solid ${groups.length === 0 ? '#4a3a1a' : canPost ? ACCENT : '#1a2540'}`, borderRadius: '16px', padding: '20px', marginBottom: '18px', textAlign: 'center' }}>
          {groups.length === 0 ? (
            <>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: '#fbbf24' }}>Join a group first!</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '14px' }}>Ask your mates for a join code to get started.</div>
              <button style={{ ...s.btn, background: '#fbbf24', color: '#0a0a0a' }} onClick={() => setTab('groups')}>Go to Groups</button>
            </>
          ) : canPost ? (
            <>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Icon.Camera size={28} color={ACCENT} />
              </div>
              <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '14px' }}>Time to post your daily shot!</div>
              <button style={s.btn} onClick={openCamera}><Icon.Camera size={16} /> Take my shot</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Next shot in</div>
              <div style={{ fontSize: '34px', fontWeight: '700', letterSpacing: '2px', color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{fmtCountdown(timeLeft)}</div>
            </>
          )}
        </div>

        {myStats && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <StatBox icon={<Icon.Flame size={14} />} label="Streak" value={myStats.streak} suffix="days" />
            <StatBox icon={<Icon.Star size={14} />} label="Points" value={myStats.totalPoints} />
            <StatBox icon={<Icon.Camera size={14} />} label="Posts" value={myStats.totalPosts} />
          </div>
        )}

        {tab === 'feed' && (
          <div>
            {/* Feed mode toggle */}
            <div style={{ display: 'flex', background: '#111', borderRadius: '12px', padding: '4px', marginBottom: '16px', border: '1px solid #1a1a1a' }}>
              <button
                onClick={() => setFeedMode('groups')}
                style={{
                  flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
                  cursor: 'pointer', fontFamily: FONT, fontWeight: '600', fontSize: '13px',
                  background: feedMode === 'groups' ? ACCENT : 'transparent',
                  color: feedMode === 'groups' ? '#fff' : '#666',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <Icon.Users size={14} /> Groups
              </button>
              <button
                onClick={() => setFeedMode('friends')}
                style={{
                  flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
                  cursor: 'pointer', fontFamily: FONT, fontWeight: '600', fontSize: '13px',
                  background: feedMode === 'friends' ? ACCENT : 'transparent',
                  color: feedMode === 'friends' ? '#fff' : '#666',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <Icon.UserPlus size={14} /> Friends
              </button>
            </div>

            {/* GROUPS FEED */}
            {feedMode === 'groups' && (() => {
              const myOwnPosts = posts.filter(p => p.userId === profile?.id);
              const groupPosts = activeGroup
                ? posts.filter(p => activeGroupMemberIds.includes(p.userId))
                : myOwnPosts;

              if (!activeGroup && myOwnPosts.length === 0) return (
                <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><Icon.Users size={40} color="#3a3a55" /></div>
                  <div style={{ fontSize: '17px', color: '#f0f0f0', fontWeight: '700', marginBottom: '6px' }}>You're not in a group yet</div>
                  <div style={{ fontSize: '13px', color: '#555', marginBottom: '20px', lineHeight: 1.5 }}>Ask your mates for a join code, or create your own group.</div>
                  <button onClick={() => setTab('groups')} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>Go to Groups</button>
                </div>
              );

              if (groupPosts.length === 0) return <EmptyState icon={<Icon.Camera size={36} color="#3a3a55" />} title="No selfies yet" sub="Be the first, Dad." />;

              const myLatest = groupPosts.find(p => p.userId === profile?.id);
              const others = groupPosts.filter(p => p.id !== myLatest?.id);
              const ordered = myLatest ? [myLatest, ...others] : groupPosts;
              return ordered.map((post, idx) => {
                const isMine = post.userId === profile?.id;
                const isPinned = isMine && post.id === myLatest?.id && idx === 0;
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    isMine={isMine}
                    isPinned={isPinned}
                    reactions={reactions.filter(r => r.post_id === post.id)}
                    myReaction={reactions.find(r => r.post_id === post.id && r.user_id === profile?.id)}
                    pickerOpen={openReactionPost === post.id}
                    onTogglePicker={() => setOpenReactionPost(openReactionPost === post.id ? null : post.id)}
                    onReact={(emoji) => toggleReaction(post.id, emoji)}
                    onProfileClick={() => setViewingProfileId(post.userId)}
                  />
                );
              });
            })()}

            {/* FRIENDS FEED — last 24h only, one per friend */}
            {feedMode === 'friends' && (() => {
              const acceptedFriendIds = friendships
                .filter(f => f.status === 'accepted')
                .map(f => f.requester_id === profile?.id ? f.addressee_id : f.requester_id);

              if (acceptedFriendIds.length === 0) return (
                <EmptyState
                  icon={<Icon.UserPlus size={36} color="#3a3a55" />}
                  title="No friends yet"
                  sub="Add friends using the 👥+ icon in the header."
                />
              );

              const since24h = Date.now() - 86400000;
              // One post per friend — their most recent within 24h
              const friendPosts = acceptedFriendIds
                .map(id => {
                  const recent = posts
                    .filter(p => p.userId === id && p.ts > since24h)
                    .sort((a, b) => b.ts - a.ts)[0];
                  return recent || null;
                })
                .filter(Boolean)
                .sort((a, b) => b.ts - a.ts);

              // Also include your own most recent post if within 24h
              const myRecent = posts.filter(p => p.userId === profile?.id && p.ts > since24h).sort((a, b) => b.ts - a.ts)[0];
              const allFriendPosts = myRecent
                ? [myRecent, ...friendPosts.filter(p => p.userId !== profile?.id)]
                : friendPosts;

              // Show friends who haven't posted yet
              const postedIds = new Set(friendPosts.map(p => p.userId));
              const notPosted = acceptedFriendIds.filter(id => !postedIds.has(id));

              if (allFriendPosts.length === 0 && notPosted.length === 0) return (
                <EmptyState icon={<Icon.Camera size={36} color="#3a3a55" />} title="No shots today yet" sub="Check back later — your mates haven't posted." />
              );

              return (
                <>
                  {allFriendPosts.map(post => {
                    const isMine = post.userId === profile?.id;
                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        isMine={isMine}
                        isPinned={isMine}
                        reactions={reactions.filter(r => r.post_id === post.id)}
                        myReaction={reactions.find(r => r.post_id === post.id && r.user_id === profile?.id)}
                        pickerOpen={openReactionPost === post.id}
                        onTogglePicker={() => setOpenReactionPost(openReactionPost === post.id ? null : post.id)}
                        onReact={(emoji) => toggleReaction(post.id, emoji)}
                        onProfileClick={() => setViewingProfileId(post.userId)}
                      />
                    );
                  })}
                  {notPosted.length > 0 && (
                    <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '14px 16px', marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Waiting on ({notPosted.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {notPosted.map(id => (
                          <button
                            key={id}
                            onClick={() => setViewingProfileId(id)}
                            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '6px 12px', fontSize: '13px', color: '#666', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0d1424', border: `1px solid ${ACCENT}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: ACCENT }}>
                              {(profiles[id]?.name || '?').charAt(0).toUpperCase()}
                            </span>
                            {profiles[id]?.name || 'Unknown'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {tab === 'leaderboard' && activeGroup && <Leaderboard group={activeGroup} members={activeGroupMembers} allPosts={posts} myId={profile?.id} onProfileClick={(id) => setViewingProfileId(id)} />}
        {tab === 'leaderboard' && !activeGroup && <EmptyState icon={<Icon.Trophy size={36} color="#3a3a55" />} title="No group selected" sub="Join or create a group first." />}

        {tab === 'groups' && <GroupsTab groups={groups} form={form} setForm={setForm} createGroup={createGroup} joinGroup={joinGroup} leaveGroup={leaveGroup} err={err} info={info} atMax={groups.length >= MAX_GROUPS_PER_USER} />}

        {tab === 'compete' && (
          <CompeteTab
            groups={groups}
            matches={matches}
            memberships={memberships}
            allPosts={posts}
            myId={profile?.id}
            onSubmit={submitGroupToLobby}
            onWithdraw={withdrawFromLobby}
          />
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0a0a', borderTop: '1px solid #1a1a1a', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex' }}>
          <NavBtn icon={<Icon.Camera size={20} />} label="Feed" active={tab === 'feed'} onClick={() => { setTab('feed'); }} />
          <NavBtn icon={<Icon.Trophy size={20} />} label="Ranks" active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')} />
          <NavBtn icon={<Icon.Zap size={20} />} label="Compete" active={tab === 'compete'} onClick={() => setTab('compete')} />
          <NavBtn icon={<Icon.Users size={20} />} label="Groups" active={tab === 'groups'} onClick={() => setTab('groups')} />
        </div>
      </div>

      {viewingProfileId && (
        <ProfileView
          userId={viewingProfileId}
          profileData={profiles[viewingProfileId]}
          allPosts={posts}
          allMemberships={memberships}
          allGroups={groups}
          isMe={viewingProfileId === profile?.id}
          friendshipStatus={getFriendshipStatus(viewingProfileId)}
          onSendRequest={() => sendFriendRequest(viewingProfileId)}
          onRespond={(id, accept) => respondToRequest(id, accept)}
          onRemove={(id) => removeFriend(id)}
          onClose={() => setViewingProfileId(null)}
        />
      )}

      {showFriendSearch && (
        <FriendSearch
          query={friendSearchQuery}
          onQueryChange={(q) => { setFriendSearchQuery(q); searchFriends(q); }}
          results={friendSearchResults}
          searching={friendSearching}
          friendships={friendships}
          myId={profile?.id}
          pendingIncoming={pendingIncoming}
          profiles={profiles}
          onSendRequest={sendFriendRequest}
          onRespond={respondToRequest}
          onRemove={removeFriend}
          onViewProfile={(id) => { setShowFriendSearch(false); setViewingProfileId(id); }}
          onClose={() => { setShowFriendSearch(false); setFriendSearchQuery(''); setFriendSearchResults([]); }}
        />
      )}
    </div>
  );
}

function PostCard({ post, isMine, isPinned, reactions, myReaction, pickerOpen, onTogglePicker, onReact, onProfileClick }) {
  // Group reactions by emoji and count
  const counts = {};
  reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
  const sortedEmojis = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  return (
    <div style={{
      background: '#111',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '14px',
      border: isPinned ? `2px solid ${ACCENT}` : '1px solid #1a1a1a',
      boxShadow: isPinned ? `0 0 0 4px rgba(59, 130, 246, 0.1)` : 'none',
    }}>
      {isPinned && (
        <div style={{ background: '#0d1424', padding: '6px 14px', fontSize: '11px', color: ACCENT, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: `1px solid ${ACCENT}` }}>
          📌 Your post
        </div>
      )}
      <img src={post.img} alt={post.userName} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <button onClick={onProfileClick} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT, color: '#f0f0f0', fontWeight: '700', fontSize: '15px', textAlign: 'left' }}>{post.userName}</button>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{fmtTime(post.ts)}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', background: post.points === 2 ? '#0d2818' : '#1a1500', color: post.points === 2 ? '#22c55e' : '#fbbf24', border: `1px solid ${post.points === 2 ? '#1a4a2a' : '#4a3a1a'}`, borderRadius: '20px', padding: '3px 9px', fontWeight: '600' }}>+{post.points}</span>
            {isMine && <span style={{ fontSize: '11px', background: '#0d1424', color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: '20px', padding: '3px 8px' }}>You</span>}
          </div>
        </div>

        {/* Reactions row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {sortedEmojis.map(emoji => {
            const isMyEmoji = myReaction?.emoji === emoji;
            return (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                style={{
                  background: isMyEmoji ? '#0d1424' : '#1a1a1a',
                  border: `1px solid ${isMyEmoji ? ACCENT : '#2a2a2a'}`,
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: FONT,
                  color: '#f0f0f0',
                }}
              >
                <span>{emoji}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: isMyEmoji ? ACCENT : '#888' }}>{counts[emoji]}</span>
              </button>
            );
          })}
          <button
            onClick={onTogglePicker}
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: FONT,
              color: '#888',
            }}
          >
            {myReaction ? '✏️' : '😀+'}
          </button>
        </div>

        {/* Picker */}
        {pickerOpen && (
          <div style={{
            display: 'flex', gap: '4px', marginTop: '10px',
            background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '12px',
            padding: '8px', flexWrap: 'wrap', justifyContent: 'center'
          }}>
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                style={{
                  background: myReaction?.emoji === emoji ? '#0d1424' : 'transparent',
                  border: `1px solid ${myReaction?.emoji === emoji ? ACCENT : 'transparent'}`,
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '22px',
                  cursor: 'pointer',
                }}
              >{emoji}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileView({ userId, profileData, allPosts, allMemberships, allGroups, isMe, friendshipStatus, onSendRequest, onRespond, onRemove, onClose }) {
  const userPosts = allPosts.filter(p => p.userId === userId);
  const stats = userStats(userPosts);
  // Find shared groups: groups this user is in that I'm also in (allGroups already only contains my groups)
  const myGroupIds = allGroups.map(g => g.id);
  const theirMemberships = allMemberships.filter(m => m.user_id === userId);
  const sharedGroups = allGroups.filter(g => theirMemberships.find(m => m.group_id === g.id));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
      zIndex: 1000, overflowY: 'auto', fontFamily: FONT,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px'
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px',
        maxWidth: '440px', width: '100%', overflow: 'hidden', position: 'relative'
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 2,
          background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '50%',
          width: '32px', height: '32px', cursor: 'pointer', color: '#888',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT
        }}>✕</button>

        {/* Avatar header */}
        <div style={{ padding: '32px 20px 20px', textAlign: 'center', background: '#0d1424', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', background: '#1a1a2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '32px', fontWeight: '700', color: ACCENT,
            border: `2px solid ${ACCENT}`
          }}>
            {(profileData?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {profileData?.name || 'Unknown'}
            {isMe && <span style={{ fontSize: '11px', background: '#0a0a0a', color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: '20px', padding: '3px 8px', fontWeight: '600' }}>You</span>}
            {stats.isRelegated && <span style={{ fontSize: '11px', background: '#3a0f0f', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '20px', padding: '3px 8px', fontWeight: '700' }}>RELEGATED</span>}
            {stats.escapingRelegation && <span style={{ fontSize: '11px', background: '#0d2818', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '20px', padding: '3px 8px', fontWeight: '700' }}>ESCAPING</span>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: ACCENT }}>{stats.totalPoints}</div>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px', fontWeight: '600' }}>Points</div>
          </div>
          <div style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: ACCENT }}>{stats.streak}</div>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px', fontWeight: '600' }}>Streak</div>
          </div>
          <div style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: ACCENT }}>{stats.totalPosts}</div>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px', fontWeight: '600' }}>Posts</div>
          </div>
        </div>

        {/* Shared Groups */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            {isMe ? 'Your Groups' : 'Shared Groups'}
          </div>
          {sharedGroups.length === 0 && (
            <div style={{ fontSize: '13px', color: '#555', padding: '8px 0' }}>None</div>
          )}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {sharedGroups.map(g => (
              <span key={g.id} style={{
                background: '#0d1424', color: ACCENT, border: `1px solid ${ACCENT}`,
                borderRadius: '20px', padding: '5px 12px', fontSize: '13px', fontWeight: '600'
              }}>{g.name}</span>
            ))}
          </div>
        </div>

        {/* Recent posts */}
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Recent Posts ({userPosts.length})
          </div>
          {userPosts.length === 0 && (
            <div style={{ fontSize: '13px', color: '#555', padding: '8px 0' }}>No posts yet.</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {userPosts.slice(0, 9).map(p => (
              <img key={p.id} src={p.img} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px' }} />
            ))}
          </div>
        </div>

        {/* Friend action placeholder */}
        {!isMe && (
          <div style={{ padding: '0 16px 20px' }}>
            <FriendButton
              friendshipStatus={friendshipStatus}
              onSendRequest={onSendRequest}
              onRespond={onRespond}
              onRemove={onRemove}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FriendButton({ friendshipStatus, onSendRequest, onRespond, onRemove }) {
  const fs = friendshipStatus;
  if (!fs) return (
    <button onClick={onSendRequest} style={{ width: '100%', background: ACCENT, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      <Icon.UserPlus size={16} /> Add Friend
    </button>
  );
  if (fs.status === 'pending' && fs.iAmRequester) return (
    <button disabled style={{ width: '100%', background: '#1a1a1a', color: '#666', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed', fontFamily: FONT }}>
      Request sent ⏳
    </button>
  );
  if (fs.status === 'pending' && !fs.iAmRequester) return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button onClick={() => onRespond(fs.id, true)} style={{ flex: 1, background: ACCENT, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>Accept</button>
      <button onClick={() => onRespond(fs.id, false)} style={{ flex: 1, background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>Decline</button>
    </div>
  );
  if (fs.status === 'accepted') return (
    <button onClick={() => onRemove(fs.id)} style={{ width: '100%', background: '#0d2818', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
      ✓ Friends — tap to unfriend
    </button>
  );
  return null;
}

function FriendSearch({ query, onQueryChange, results, searching, friendships, myId, pendingIncoming, profiles, onSendRequest, onRespond, onRemove, onViewProfile, onClose }) {
  const getFriendship = (otherId) => friendships.find(f =>
    (f.requester_id === myId && f.addressee_id === otherId) ||
    (f.addressee_id === myId && f.requester_id === otherId)
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)', zIndex: 1000, fontFamily: FONT, display: 'flex', flexDirection: 'column', padding: '0' }}>
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', flexShrink: 0 }}>✕</button>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon.Search size={15} color="#666" />
          </div>
          <input
            autoFocus
            style={{ width: '100%', background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px 12px 10px 36px', fontSize: '15px', color: '#f0f0f0', outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }}
            placeholder="Search by name or email..."
            value={query}
            onChange={e => onQueryChange(e.target.value)}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', maxWidth: '480px', width: '100%', alignSelf: 'center' }}>
        {/* Pending incoming requests */}
        {pendingIncoming.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
              Friend Requests ({pendingIncoming.length})
            </div>
            {pendingIncoming.map(fs => {
              const p = profiles[fs.requester_id];
              return (
                <div key={fs.id} style={{ background: '#111', border: '1px solid #3a0f0f', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a1a2e', border: `1px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: ACCENT, flexShrink: 0 }}>
                    {(p?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{p?.name || 'Someone'}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '1px' }}>wants to be friends</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => onRespond(fs.id, true)} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>Accept</button>
                    <button onClick={() => onRespond(fs.id, false)} style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search results */}
        {query.length >= 2 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
              {searching ? 'Searching...' : `Results (${results.length})`}
            </div>
            {!searching && results.length === 0 && (
              <div style={{ textAlign: 'center', color: '#555', padding: '30px 0', fontSize: '14px' }}>No one found with that name.</div>
            )}
            {results.map(r => {
              const fs = getFriendship(r.id);
              const isFriend = fs?.status === 'accepted';
              const isPending = fs?.status === 'pending';
              const iAmRequester = fs?.requester_id === myId;
              return (
                <div key={r.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => onViewProfile(r.id)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a1a2e', border: `1px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: ACCENT, flexShrink: 0, cursor: 'pointer' }}>
                    {r.name.charAt(0).toUpperCase()}
                  </button>
                  <button onClick={() => onViewProfile(r.id)} style={{ flex: 1, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, color: '#f0f0f0' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{r.name}</div>
                    {isFriend && <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '1px' }}>✓ Friends</div>}
                    {isPending && <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '1px' }}>{iAmRequester ? 'Request sent' : 'Wants to be friends'}</div>}
                  </button>
                  <div>
                    {!fs && <button onClick={() => onSendRequest(r.id)} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon.UserPlus size={13} /> Add</button>}
                    {isPending && !iAmRequester && <button onClick={() => onRespond(fs.id, true)} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>Accept</button>}
                    {isFriend && <button onClick={() => onRemove(fs.id)} style={{ background: '#1a1a1a', color: '#666', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Unfriend</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {query.length === 0 && pendingIncoming.length === 0 && (
          <div style={{ textAlign: 'center', color: '#444', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontSize: '15px', color: '#888', fontWeight: '600' }}>Find your mates</div>
            <div style={{ fontSize: '13px', color: '#555', marginTop: '6px' }}>Type a name to search</div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: 'transparent', border: 'none', padding: '12px 0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      color: active ? ACCENT : '#666', cursor: 'pointer', fontFamily: FONT,
    }}>{icon}<span style={{ fontSize: '11px', fontWeight: '600' }}>{label}</span></button>
  );
}

function StatBox({ icon, label, value, suffix }) {
  return (
    <div style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#888', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: '600' }}>
        {icon}<span>{label}</span>
      </div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {suffix && <div style={{ fontSize: '11px', color: '#555' }}>{suffix}</div>}
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 0' }}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '15px', color: '#888', fontWeight: '600' }}>{title}</div>
      {sub && <div style={{ fontSize: '13px', marginTop: '6px', color: '#555' }}>{sub}</div>}
    </div>
  );
}

function Leaderboard({ group, members, allPosts, myId, onProfileClick }) {
  const memberIds = members.map(m => m.id);
  const groupCreatedAt = new Date(group.created_at).getTime();
  const gStats = groupStats(memberIds, allPosts, groupCreatedAt);
  return (
    <div>
      <div style={{ background: '#0d1424', border: `1px solid ${ACCENT}`, borderRadius: '16px', padding: '18px', marginBottom: '18px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>{group.name}</div>
        <div style={{ fontSize: '40px', fontWeight: '700', color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{gStats.finalScore}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>group points</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '12px', fontSize: '11px', flexWrap: 'wrap' }}>
          <span style={{ color: '#22c55e' }}>● {gStats.perfectDays} perfect</span>
          <span style={{ color: '#fbbf24' }}>● {gStats.halfDays} half</span>
          {gStats.penalties > 0 && <span style={{ color: '#ef4444' }}>−{gStats.penalties} penalty</span>}
        </div>
      </div>

      <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Member Ranking</div>
      {members.map((m, i) => {
        const isMe = m.id === myId;
        return (
          <button
            key={m.id}
            onClick={() => onProfileClick && onProfileClick(m.id)}
            style={{
              width: '100%',
              background: isMe ? '#0d1424' : '#111',
              border: `1px solid ${isMe ? ACCENT : '#1a1a1a'}`,
              borderRadius: '12px', padding: '12px 14px', marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '12px',
              cursor: 'pointer', fontFamily: FONT, color: '#f0f0f0', textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '700', minWidth: '32px' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ color: '#444' }}>#{i + 1}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', fontSize: '15px' }}>{m.profile?.name || 'Unknown'}</span>
                {m.stats.isRelegated && <span style={{ fontSize: '10px', background: '#3a0f0f', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '5px', padding: '2px 6px', fontWeight: '700' }}>RELEGATED</span>}
                {m.stats.escapingRelegation && <span style={{ fontSize: '10px', background: '#0d2818', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '5px', padding: '2px 6px', fontWeight: '700' }}>ESCAPING</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                {m.stats.streak} streak · {m.stats.totalPosts} posts
                {m.stats.isRelegated && ` · ${m.stats.last7}/5 to escape`}
              </div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{m.stats.totalPoints}</div>
          </button>
        );
      })}

      <div style={{ marginTop: '16px', padding: '12px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', fontSize: '11px', color: '#666', lineHeight: 1.6 }}>
        <strong style={{ color: '#888' }}>How scoring works:</strong><br />
        On time (24h) = 2 pts · Late (48h) = 1 pt<br />
        Group: 100% posting = +2 / 50%+ = +1 / Relegation = −5
      </div>
    </div>
  );
}

function CompeteTab({ groups, matches, memberships, allPosts, myId, onSubmit, onWithdraw }) {
  const MATCH_DURATION = 14 * 86400000;

  // Groups this user created
  const myCreatedGroups = groups.filter(g => {
    const mem = memberships.find(m => m.group_id === g.id && m.user_id === myId);
    return mem && g.created_by === myId;
  });

  // All matches visible to me
  const myGroupIds = groups.map(g => g.id);

  const activeMatches = matches.filter(m =>
    m.status === 'active' &&
    (myGroupIds.includes(m.group_a_id) || myGroupIds.includes(m.group_b_id))
  );
  const waitingMatches = matches.filter(m =>
    m.status === 'waiting' && myGroupIds.includes(m.group_a_id)
  );
  const completedMatches = matches.filter(m =>
    m.status === 'complete' &&
    (myGroupIds.includes(m.group_a_id) || myGroupIds.includes(m.group_b_id))
  );

  function groupName(groupId) {
    return groups.find(g => g.id === groupId)?.name || 'Unknown Group';
  }

  function getMatchScore(match, groupId) {
    const memberIds = memberships.filter(m => m.group_id === groupId).map(m => m.user_id);
    const startTs = new Date(match.started_at).getTime();
    const endTs = new Date(match.ends_at).getTime();
    return matchScore(memberIds, allPosts, startTs, endTs);
  }

  function MatchCard({ match }) {
    const isGroupA = myGroupIds.includes(match.group_a_id);
    const myGroupId = isGroupA ? match.group_a_id : match.group_b_id;
    const oppGroupId = isGroupA ? match.group_b_id : match.group_a_id;
    const myScore = getMatchScore(match, myGroupId);
    const oppScore = getMatchScore(match, oppGroupId);
    const endTs = new Date(match.ends_at).getTime();
    const timeLeft = Math.max(0, endTs - Date.now());
    const daysLeft = Math.ceil(timeLeft / 86400000);
    const isWinning = myScore.avgPerDay >= oppScore.avgPerDay;
    const isTied = myScore.avgPerDay === oppScore.avgPerDay;
    const isComplete = match.status === 'complete' || Date.now() >= endTs;

    return (
      <div style={{ background: '#111', border: `1px solid ${isWinning && !isTied ? '#1a4a2a' : '#1a1a1a'}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '14px' }}>
        {/* Header */}
        <div style={{ background: isComplete ? '#0f0f0f' : '#0d1424', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: isComplete ? '#888' : ACCENT, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {isComplete ? '⚑ Final Result' : `⚡ Live — ${daysLeft}d left`}
          </span>
          <span style={{ fontSize: '11px', color: '#555' }}>pts/day avg</span>
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
          {/* My group */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f0f0', marginBottom: '4px', wordBreak: 'break-word' }}>{groupName(myGroupId)}</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: isWinning ? '#22c55e' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{myScore.avgPerDay.toFixed(1)}</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{myScore.rawScore} total</div>
          </div>

          {/* VS */}
          <div style={{ padding: '0 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#333' }}>VS</div>
            {isComplete && (
              <div style={{ fontSize: '20px', marginTop: '4px' }}>
                {isTied ? '🤝' : isWinning ? '🏆' : '💀'}
              </div>
            )}
          </div>

          {/* Opponent */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f0f0', marginBottom: '4px', wordBreak: 'break-word' }}>{groupName(oppGroupId)}</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: !isWinning ? '#22c55e' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{oppScore.avgPerDay.toFixed(1)}</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{oppScore.rawScore} total</div>
          </div>
        </div>

        {/* Podium for completed matches */}
        {isComplete && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              {isTied ? (
                <div style={{ color: '#fbbf24', fontWeight: '700', fontSize: '14px' }}>🤝 It's a draw! Both groups tied.</div>
              ) : isWinning ? (
                <>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🥇</div>
                  <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '14px' }}>{groupName(myGroupId)} won!</div>
                  <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>{myScore.avgPerDay.toFixed(2)} vs {oppScore.avgPerDay.toFixed(2)} pts/day</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🥈</div>
                  <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>{groupName(oppGroupId)} won.</div>
                  <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>Better luck next time — {myScore.avgPerDay.toFixed(2)} vs {oppScore.avgPerDay.toFixed(2)} pts/day</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Live progress bar */}
        {!isComplete && (() => {
          const total = myScore.avgPerDay + oppScore.avgPerDay;
          const myPct = total > 0 ? (myScore.avgPerDay / total) * 100 : 50;
          return (
            <div style={{ padding: '0 16px 14px' }}>
              <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${myPct}%`, background: '#22c55e', transition: 'width 0.5s' }} />
                <div style={{ flex: 1, background: '#ef4444' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555', marginTop: '4px' }}>
                <span>{groupName(myGroupId)}</span>
                <span>{groupName(oppGroupId)}</span>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // Groups eligible to enter (created by me, not already in a match)
  const eligibleGroups = myCreatedGroups.filter(g => {
    const inMatch = matches.find(m =>
      (m.group_a_id === g.id || m.group_b_id === g.id) &&
      (m.status === 'waiting' || m.status === 'active')
    );
    return !inMatch;
  });

  return (
    <div>
      {/* Active matches */}
      {activeMatches.length > 0 && (
        <>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Active Matches</div>
          {activeMatches.map(m => <MatchCard key={m.id} match={m} />)}
        </>
      )}

      {/* Waiting in lobby */}
      {waitingMatches.length > 0 && (
        <>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', marginTop: activeMatches.length ? '20px' : 0 }}>In Lobby</div>
          {waitingMatches.map(m => (
            <div key={m.id} style={{ background: '#111', border: '1px solid #4a3a1a', borderRadius: '14px', padding: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{groupName(m.group_a_id)}</div>
                <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '3px' }}>⏳ Waiting for an opponent...</div>
              </div>
              <button onClick={() => onWithdraw(m.id)} style={{ background: '#1a1a1a', color: '#666', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Withdraw</button>
            </div>
          ))}
        </>
      )}

      {/* Enter competition */}
      {eligibleGroups.length > 0 && (
        <>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', marginTop: (activeMatches.length || waitingMatches.length) ? '20px' : 0 }}>Enter Competition</div>
          <div style={{ background: '#0d1424', border: `1px solid ${ACCENT}`, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#9bb5e8', marginBottom: '12px', lineHeight: 1.5 }}>
              Submit a group to the matchmaking pool. You'll be auto-matched against the next group that enters. 14-day match, scored on points-per-day average.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {eligibleGroups.map(g => (
                <button key={g.id} onClick={() => onSubmit(g.id)} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{g.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon.Zap size={14} /> Enter</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Completed matches */}
      {completedMatches.length > 0 && (
        <>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', marginTop: '20px' }}>Past Matches</div>
          {completedMatches.map(m => <MatchCard key={m.id} match={m} />)}
        </>
      )}

      {/* Empty state */}
      {activeMatches.length === 0 && waitingMatches.length === 0 && completedMatches.length === 0 && eligibleGroups.length === 0 && (
        <EmptyState
          icon={<Icon.Zap size={36} color="#3a3a55" />}
          title="No competitions yet"
          sub={myCreatedGroups.length === 0 ? "Only group creators can enter competitions. Create a group first." : "All your groups are already competing!"}
        />
      )}
    </div>
  );
}

function GroupsTab({ groups, form, setForm, createGroup, joinGroup, leaveGroup, err, info, atMax }) {
  const ss = {
    section: { fontSize: '11px', fontWeight: '700', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', marginTop: '4px' },
    input: { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#f0f0f0', width: '100%', outline: 'none', fontFamily: FONT, boxSizing: 'border-box' },
    btn: { background: ACCENT, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT },
    card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px', marginBottom: '10px' },
  };
  return (
    <div>
      <div style={ss.section}>Your Groups ({groups.length}/{MAX_GROUPS_PER_USER})</div>
      {groups.length === 0 && <EmptyState icon={<Icon.Users size={36} color="#3a3a55" />} title="Not in any groups yet" sub="Create one or join with a code below." />}
      {groups.map(g => (
        <div key={g.id} style={ss.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>{g.name}</div>
            <button onClick={() => leaveGroup(g.id)} style={{ background: 'transparent', color: '#666', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>Leave</button>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Join code:</div>
          <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '4px', color: ACCENT, fontFamily: 'monospace', marginTop: '4px', userSelect: 'all' }}>{g.join_code}</div>
        </div>
      ))}

      {!atMax && (
        <>
          <div style={{ ...ss.section, marginTop: '24px' }}>Create New Group</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input style={ss.input} placeholder="Group name" value={form.groupName} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))} />
            <button style={ss.btn} onClick={createGroup}>Create</button>
          </div>
          <div style={{ ...ss.section, marginTop: '20px' }}>Join With Code</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={ss.input} placeholder="6-char code" value={form.joinCode} onChange={e => setForm(f => ({ ...f, joinCode: e.target.value.toUpperCase() }))} maxLength={6} />
            <button style={ss.btn} onClick={joinGroup}>Join</button>
          </div>
        </>
      )}

      {atMax && (
        <div style={{ marginTop: '20px', padding: '14px', background: '#0d1424', border: `1px solid ${ACCENT}`, borderRadius: '12px', fontSize: '13px', color: '#9bb5e8', textAlign: 'center' }}>
          You're at the {MAX_GROUPS_PER_USER}-group limit. Leave one to join another.
        </div>
      )}

      {err && <div style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>{err}</div>}
      {info && <div style={{ color: '#22c55e', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>{info}</div>}
    </div>
  );
}
