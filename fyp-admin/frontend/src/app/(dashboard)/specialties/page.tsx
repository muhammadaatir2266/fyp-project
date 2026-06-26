'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, X, Check, Loader2, Stethoscope, Tag, Users } from 'lucide-react';

interface Specialty {
  id: string;
  name: string;
  description: string | null;
  iconName: string | null;
  aliases: string[];
  _count: { doctors: number };
}

interface FormState {
  name: string;
  description: string;
  iconName: string;
  aliases: string;
}

const emptyForm: FormState = { name: '', description: '', iconName: '', aliases: '' };

function SpecialtyModal({
  title,
  form,
  saving,
  error,
  onChange,
  onSave,
  onClose,
}: {
  title: string;
  form: FormState;
  saving: boolean;
  error: string;
  onChange: (patch: Partial<FormState>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Cardiology"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Input
              placeholder="Brief description of the specialty"
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon name</label>
            <Input
              placeholder="e.g. heart, brain, stethoscope"
              value={form.iconName}
              onChange={(e) => onChange({ iconName: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Lucide icon name used in the patient app.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aliases</label>
            <Input
              placeholder="Cardiologist, Heart Specialist, Heart Doctor"
              value={form.aliases}
              onChange={(e) => onChange({ aliases: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated alternative names — used by the AI to map free-text to this specialty.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const [editTarget, setEditTarget] = useState<Specialty | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Specialty | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: Specialty[] = await api.get('/admin/specialties');
      setSpecialties(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = specialties.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const formToPayload = (f: FormState) => ({
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    iconName: f.iconName.trim() || undefined,
    aliases: f.aliases.split(',').map((a) => a.trim()).filter(Boolean),
  });

  // --- Add ---
  const handleAdd = async () => {
    if (!addForm.name.trim()) { setAddError('Name is required'); return; }
    setAddSaving(true);
    setAddError('');
    try {
      await api.post('/admin/specialties', formToPayload(addForm));
      setShowAdd(false);
      setAddForm(emptyForm);
      await load();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to create specialty');
    } finally {
      setAddSaving(false);
    }
  };

  // --- Edit ---
  const openEdit = (s: Specialty) => {
    setEditTarget(s);
    setEditForm({
      name: s.name,
      description: s.description ?? '',
      iconName: s.iconName ?? '',
      aliases: s.aliases.join(', '),
    });
    setEditError('');
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) { setEditError('Name is required'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      await api.put(`/admin/specialties/${editTarget.id}`, formToPayload(editForm));
      setEditTarget(null);
      await load();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Failed to update specialty');
    } finally {
      setEditSaving(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/specialties/${deleteTarget.id}`);
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete specialty');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Specialties</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the canonical specialty list used across doctor signup, patient search, and AI recommendations.
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); setAddForm(emptyForm); setAddError(''); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Specialty
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Input
          placeholder="Search specialties…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {search ? 'No specialties match your search.' : 'No specialties yet. Add one above.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{s.name}</h3>
                    {s.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setDeleteTarget(s); setDeleteError(''); }}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 items-center text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {s._count.doctors} doctor{s._count.doctors !== 1 ? 's' : ''}
                  </span>
                  {s.iconName && (
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {s.iconName}
                    </span>
                  )}
                </div>

                {s.aliases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.aliases.map((alias) => (
                      <Badge key={alias} variant="secondary" className="text-xs font-normal">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <SpecialtyModal
          title="Add Specialty"
          form={addForm}
          saving={addSaving}
          error={addError}
          onChange={(p) => setAddForm((f) => ({ ...f, ...p }))}
          onSave={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <SpecialtyModal
          title={`Edit — ${editTarget.name}`}
          form={editForm}
          saving={editSaving}
          error={editError}
          onChange={(p) => setEditForm((f) => ({ ...f, ...p }))}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete &ldquo;{deleteTarget.name}&rdquo;?</h2>
            {deleteTarget._count.doctors > 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                {deleteTarget._count.doctors} doctor(s) are currently assigned to this specialty. Reassign them before deleting.
              </p>
            ) : (
              <p className="text-sm text-gray-600">This cannot be undone.</p>
            )}
            {deleteError && (
              <p className="text-sm text-red-600 mt-3">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading || deleteTarget._count.doctors > 0}
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
