"use client";

import { useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { createPoll } from '@/lib/migo-logic';

export default function PollsPage() {
  const [postId, setPostId] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };
  const addOption = () => setOptions((prev) => [...prev, '']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !question || options.filter((o) => o.trim()).length < 2) return;
    setLoading(true);
    try {
      const opts = options.map((o) => o.trim()).filter(Boolean);
      await createPoll(postId.trim(), question.trim(), opts);
      setPostId('');
      setQuestion('');
      setOptions(['', '']);
      alert('Poll created');
    } catch (err) {
      console.error(err);
      alert('Error creating poll');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Create a Poll</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          placeholder="Post ID"
          className="w-full p-2 bg-[#2b2d31] text-white rounded-md focus:outline-none"
        />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Question"
          className="w-full p-2 bg-[#2b2d31] text-white rounded-md focus:outline-none"
        />
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              className="w-full p-2 bg-[#2b2d31] text-white rounded-md focus:outline-none"
            />
          ))}
          <button
            type="button"
            onClick={addOption}
            className="bg-[#232428] hover:bg-[#2b2d31] px-3 py-1 rounded-md text-sm"
          >
            + Add Option
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md"
        >
          {loading ? 'Creating…' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
}