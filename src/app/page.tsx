"use client";

import { useState, FormEvent } from "react";
import axios from "axios";

export default function CreateUserPage() {
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nid, setNid] = useState("");
  const [nationality, setNationality] = useState("");
  const [profession, setProfession] = useState("");
  const [age, setAge] = useState<number | "">("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !address ||
      !nid ||
      !nationality ||
      !profession ||
      age === "" ||
      age <= 0
    ) {
      setError("Please fill in all fields with valid values.");
      return;
    }

    setCreating(true);

    try {
      await axios.post("http://localhost:3000/user/createuser", {
        name,
        email,
        password,
        phone,
        address,
        nid,
        nationality,
        Profession: profession,
        age,
      });

      setSuccess(true);

      // Clear form fields
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setAddress("");
      setNid("");
      setNationality("");
      setProfession("");
      setAge("");
    } catch (err) {
      setError("Failed to create user");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create New User</h2>
      <form onSubmit={handleCreateUser} className="space-y-4 text-black">
        {error && (
          <div className="text-red-600 bg-red-100 p-2 rounded">{error}</div>
        )}
        {success && (
          <div className="text-green-700 bg-green-100 p-2 rounded">
            User created successfully!
          </div>
        )}

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={creating} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={creating} />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={creating} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={creating} />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={creating} />
        <Input label="NID" value={nid} onChange={(e) => setNid(e.target.value)} disabled={creating} />
        <Input label="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={creating} />
        <Input label="Profession" value={profession} onChange={(e) => setProfession(e.target.value)} disabled={creating} />
        <Input label="Age" type="number" min={1} value={age} onChange={(e) => setAge(Number(e.target.value))} disabled={creating} />

        <button
          type="submit"
          disabled={creating}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full"
        >
          {creating ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  disabled,
  min,
}: {
  label: string;
  type?: string;
  value: string | number | "";
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  min?: number;
}) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        min={min}
        className="w-full border border-gray-300 p-2 rounded"
      />
    </div>
  );
}
