import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowDown, X, FileUp, Camera } from "lucide-react";
import { type AllegatiState } from "@/components/crm/CrmFormContext";
import { useCrmForm } from "@/components/crm/CrmFormContext";

export function TabAllegati() {
  const {
    selectedMemberId,
    photoFile, setPhotoFile,
    allegati, setAllegati,
    openAllegatoSections, setOpenAllegatoSections,
    setDirtyFields
  } = useCrmForm();

  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/avif', 'image/tiff'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|heic|heif|webp|avif|tiff?)$/i)) {
      alert('Formato foto non supportato. Usa JPG, PNG, HEIC, HEIF o WebP.');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file, 800, 0.7);
      setPhotoFile({ file, preview: compressedBase64 });
      setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, photo: true }));
    } catch (e) {
      console.error("Compression failed", e);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoFile({ file, preview: e.target?.result as string });
        setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, photo: true }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile({ file: null, preview: null });
    setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, photo: true }));
  };

  const toggleAllegatoSection = (key: string) => {
    setOpenAllegatoSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileUpload = async (key: keyof AllegatiState, file: File | null) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato file non supportato. Usa PDF, JPG o PNG.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];

    if (file.type.startsWith('image/')) {
      try {
        const compressedBase64 = await compressImage(file, 1200, 0.6);
        setAllegati(prev => ({
          ...prev,
          [key]: { ...prev[key], hasFile: true, fileName: file.name, data: today, previewUrl: compressedBase64 }
        }));
        setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
      } catch (e) {
        console.error("Attachment compression failed", e);
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          setAllegati(prev => ({
            ...prev,
            [key]: { ...prev[key], hasFile: true, fileName: file.name, data: today, previewUrl: base64Data }
          }));
          setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        setAllegati(prev => ({
          ...prev,
          [key]: { ...prev[key], hasFile: true, fileName: file.name, data: today, previewUrl: base64Data }
        }));
        setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAllegatoFile = (key: keyof AllegatiState) => {
    if (confirm("Sei sicuro di voler rimuovere questo file?")) {
      setAllegati(prev => ({
        ...prev,
        [key]: { ...prev[key], hasFile: false, fileName: '', data: '', previewUrl: '' }
      }));
      setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
    }
  };

  const openPreview = (previewUrl?: string) => {
    if (!previewUrl) {
      alert("Anteprima non disponibile per questo file. Se è stato caricato prima dell'aggiornamento, ricaricalo per abilitare l'anteprima.");
      return;
    }
    const win = window.open();
    if (win) {
      if (previewUrl.startsWith('data:image/')) {
        win.document.write('<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#f0f0f0;height:100vh;"><img src="' + previewUrl + '" style="max-width:100%; max-height:100%; object-fit:contain; box-shadow:0 10px 25px rgba(0,0,0,0.1);" /></body>');
      } else {
        win.document.write('<iframe src="' + previewUrl + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
      }
    }
  };

  const updateAllegato = (key: keyof AllegatiState, field: string, value: string | number) => {
    setAllegati(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
    setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
  };

  return (
    <>
          {/* FOTO + ALLEGATI DA INSERIRE - Colonna sinistra */}
          <div className="lg:w-40 shrink-0 space-y-4">
            {/* FOTO PARTECIPANTE */}
            <Card className={photoFile.preview ? "border-green-400 dark:border-green-700" : ""}>
              <CardHeader className={`pb-2 rounded-t-lg ${photoFile.preview ? 'bg-green-100 dark:bg-green-900/40' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                <CardTitle className={`flex items-center gap-2 text-sm font-bold ${photoFile.preview ? 'text-green-700 dark:text-green-300' : 'text-amber-800 dark:text-amber-400 dark:text-amber-200'}`}>
                  <Camera className="w-4 h-4" />
                  FOTO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.heic,.heif,.webp,.avif,.tiff,.tif"
                  className="hidden"
                  id="upload-photo"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
                  data-testid="input-upload-photo"
                />
                {photoFile.preview ? (
                  <div className="relative">
                    <img
                      src={photoFile.preview}
                      alt="Foto partecipante"
                      className="w-full aspect-[3/4] object-cover rounded-md border border-input"
                      data-testid="img-photo-preview"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-1 right-1 bg-background/80 text-destructive"
                      onClick={removePhoto}
                      data-testid="button-remove-photo"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate text-center" data-testid="text-photo-filename">{photoFile.file?.name}</p>
                  </div>
                ) : (
                  <label
                    htmlFor="upload-photo"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-300 dark:border-amber-800/50 dark:border-amber-700 rounded-md aspect-[3/4] transition-colors hover:bg-muted/50"
                    data-testid="label-upload-photo"
                  >
                    <Camera className="w-10 h-10 text-amber-400" />
                    <span className="text-xs text-muted-foreground text-center px-2">Carica foto<br />JPG, PNG, HEIC, WebP</span>
                  </label>
                )}
              </CardContent>
            </Card>

            {/* ALLEGATI DA INSERIRE */}
            <Card>
              <CardHeader className="p-3 bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/40 relative">
                <CardTitle className="text-[13px] font-bold text-amber-900 dark:text-amber-300 dark:text-amber-100 uppercase tracking-wider text-center">
                  ALLEGATI DA INSERIRE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                {!selectedMemberId && (
                  <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/90 text-amber-800 dark:text-amber-400 dark:text-amber-200 border border-amber-300 dark:border-amber-800/50 dark:border-amber-700 p-3 rounded-md text-xs font-medium text-center shadow-lg shadow-amber-900/10">
                      I documenti si possono compilare solo quando è selezionato o salvato un partecipante.
                    </div>
                  </div>
                )}
                {/* DOMANDA DI TESSERAMENTO */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.domandaTesseramento.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('domandaTesseramento')}
                    data-testid="button-toggle-domanda-tesseramento"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${allegati.domandaTesseramento.hasFile ? 'text-success700 dark:text-success300' : 'text-amber-700 dark:text-amber-300'}`}>DOMANDA DI TESSERAMENTO</span>
                      {allegati.domandaTesseramento.hasFile ? (
                        <Check className="w-4 h-4 text-success600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.domandaTesseramento.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-success600 dark:text-success400">
                        <Check className="w-3 h-3" />
                        <span
                          className={`truncate max-w-[180px] ${allegati.domandaTesseramento.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={(e) => { e.stopPropagation(); openPreview(allegati.domandaTesseramento.previewUrl); }}
                        >
                          {allegati.domandaTesseramento.fileName || 'File caricato'}
                        </span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.domandaTesseramento && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border-2 border-dashed rounded-md p-3 text-center ${allegati.domandaTesseramento.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-800/50 dark:border-amber-700'}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-domanda-tesseramento"
                          onChange={(e) => {
                            handleFileUpload('domandaTesseramento', e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                          data-testid="input-upload-domanda-tesseramento"
                        />
                        {allegati.domandaTesseramento.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-success700 dark:text-success400">
                              <Check className="w-4 h-4" />
                              <span
                                className={`truncate max-w-[150px] ${allegati.domandaTesseramento.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={(e) => { e.stopPropagation(); openPreview(allegati.domandaTesseramento.previewUrl); }}
                              >
                                {allegati.domandaTesseramento.fileName || 'File caricato'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeAllegatoFile('domandaTesseramento'); }}
                              data-testid="button-remove-domanda-tesseramento"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="upload-domanda-tesseramento" className="cursor-pointer flex flex-col items-center gap-1" data-testid="label-upload-domanda-tesseramento">
                            <FileUp className="w-6 h-6 text-amber-500" />
                            <span className="text-xs text-muted-foreground">Carica PDF, JPG o PNG</span>
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Inserimento</Label>
                          <Input
                            type="date"
                            className={`h-7 text-xs ${allegati.domandaTesseramento.data ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
                            value={allegati.domandaTesseramento.data || ''}
                            onChange={(e) => updateAllegato('domandaTesseramento', 'data', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Accettato</Label>
                          <Select
                            value={allegati.domandaTesseramento.accettato || ''}
                            onValueChange={(v) => updateAllegato('domandaTesseramento', 'accettato', v)}
                          >
                            <SelectTrigger className={`h-7 text-xs ${allegati.domandaTesseramento.accettato === 'si' ? 'bg-green-100 border-green-400 text-green-800 dark:text-green-400' : allegati.domandaTesseramento.accettato === 'no' ? 'bg-orange-100 border-orange-400 text-orange-800' : ''}`}>
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Si</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* REGOLAMENTO */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.regolamento.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('regolamento')}
                    data-testid="button-toggle-regolamento"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${allegati.regolamento.hasFile ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>REGOLAMENTO</span>
                      {allegati.regolamento.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.regolamento.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span
                          className={`truncate max-w-[180px] ${allegati.regolamento.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={(e) => { e.stopPropagation(); openPreview(allegati.regolamento.previewUrl); }}
                        >
                          {allegati.regolamento.fileName || 'File caricato'}
                        </span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.regolamento && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border-2 border-dashed rounded-md p-3 text-center ${allegati.regolamento.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-800/50 dark:border-amber-700'}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-regolamento"
                          onChange={(e) => {
                            handleFileUpload('regolamento', e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                          data-testid="input-upload-regolamento"
                        />
                        {allegati.regolamento.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span
                                className={`truncate max-w-[150px] ${allegati.regolamento.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={(e) => { e.stopPropagation(); openPreview(allegati.regolamento.previewUrl); }}
                              >
                                {allegati.regolamento.fileName || 'File caricato'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeAllegatoFile('regolamento'); }}
                              data-testid="button-remove-regolamento"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="upload-regolamento" className="cursor-pointer flex flex-col items-center gap-1" data-testid="label-upload-regolamento">
                            <FileUp className="w-6 h-6 text-amber-500" />
                            <span className="text-xs text-muted-foreground">Carica PDF, JPG o PNG</span>
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Inserimento</Label>
                          <Input
                            type="date"
                            className={`h-7 text-xs ${allegati.regolamento.data ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
                            value={allegati.regolamento.data || ''}
                            onChange={(e) => updateAllegato('regolamento', 'data', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Accettato</Label>
                          <Select
                            value={allegati.regolamento.accettato || ''}
                            onValueChange={(v) => updateAllegato('regolamento', 'accettato', v)}
                          >
                            <SelectTrigger className={`h-7 text-xs ${allegati.regolamento.accettato === 'si' ? 'bg-green-100 border-green-400 text-green-800 dark:text-green-400' : allegati.regolamento.accettato === 'no' ? 'bg-orange-100 border-orange-400 text-orange-800' : ''}`}>
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Si</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PRIVACY */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.privacy.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('privacy')}
                    data-testid="button-toggle-privacy"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${allegati.privacy.hasFile ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>PRIVACY</span>
                      {allegati.privacy.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.privacy.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span
                          className={`truncate max-w-[180px] ${allegati.privacy.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={(e) => { e.stopPropagation(); openPreview(allegati.privacy.previewUrl); }}
                        >
                          {allegati.privacy.fileName || 'File caricato'}
                        </span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.privacy && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border-2 border-dashed rounded-md p-3 text-center ${allegati.privacy.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-800/50 dark:border-amber-700'}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-privacy"
                          onChange={(e) => {
                            handleFileUpload('privacy', e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                          data-testid="input-upload-privacy"
                        />
                        {allegati.privacy.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span
                                className={`truncate max-w-[150px] ${allegati.privacy.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={(e) => { e.stopPropagation(); openPreview(allegati.privacy.previewUrl); }}
                              >
                                {allegati.privacy.fileName || 'File caricato'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeAllegatoFile('privacy'); }}
                              data-testid="button-remove-privacy"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="upload-privacy" className="cursor-pointer flex flex-col items-center gap-1" data-testid="label-upload-privacy">
                            <FileUp className="w-6 h-6 text-amber-500" />
                            <span className="text-xs text-muted-foreground">Carica PDF, JPG o PNG</span>
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Inserimento</Label>
                          <Input
                            type="date"
                            className={`h-7 text-xs ${allegati.privacy.data ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
                            value={allegati.privacy.data || ''}
                            onChange={(e) => updateAllegato('privacy', 'data', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Accettata</Label>
                          <Select
                            value={allegati.privacy.accettata || ''}
                            onValueChange={(v) => updateAllegato('privacy', 'accettata', v)}
                          >
                            <SelectTrigger className={`h-7 text-xs ${allegati.privacy.accettata === 'si' ? 'bg-green-100 border-green-400 text-green-800 dark:text-green-400' : allegati.privacy.accettata === 'no' ? 'bg-orange-100 border-orange-400 text-orange-800' : ''}`}>
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Si</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CERTIFICATO MEDICO */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.certificatoMedico.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('certificatoMedico')}
                    data-testid="button-toggle-certificato-medico"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">CERTIFICATO MEDICO</span>
                      {allegati.certificatoMedico.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.certificatoMedico.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span
                          className={`truncate max-w-[180px] ${allegati.certificatoMedico.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={(e) => { e.stopPropagation(); openPreview(allegati.certificatoMedico.previewUrl); }}
                        >
                          {allegati.certificatoMedico.fileName || 'File caricato'}
                        </span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.certificatoMedico && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border-2 border-dashed rounded-md p-3 text-center ${allegati.certificatoMedico.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-800/50 dark:border-amber-700'}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-certificato-medico"
                          onChange={(e) => {
                            handleFileUpload('certificatoMedico', e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                          data-testid="input-upload-certificato-medico"
                        />
                        {allegati.certificatoMedico.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span
                                className={`truncate max-w-[150px] ${allegati.certificatoMedico.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={(e) => { e.stopPropagation(); openPreview(allegati.certificatoMedico.previewUrl); }}
                              >
                                {allegati.certificatoMedico.fileName || 'File caricato'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeAllegatoFile('certificatoMedico'); }}
                              data-testid="button-remove-certificato-medico"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="upload-certificato-medico" className="cursor-pointer flex flex-col items-center gap-1" data-testid="label-upload-certificato-medico">
                            <FileUp className="w-6 h-6 text-amber-500" />
                            <span className="text-xs text-muted-foreground">Carica PDF, JPG o PNG</span>
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Rilascio</Label>
                          <Input
                            type="date"
                            className={`h-7 text-xs ${allegati.certificatoMedico.dataRilascio ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
                            value={allegati.certificatoMedico.dataRilascio || ''}
                            onChange={(e) => updateAllegato('certificatoMedico', 'dataRilascio', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Scadenza</Label>
                          <Input
                            type="date"
                            className={`h-7 text-xs ${allegati.certificatoMedico.scadenza ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
                            value={allegati.certificatoMedico.scadenza || ''}
                            onChange={(e) => updateAllegato('certificatoMedico', 'scadenza', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                          value={allegati.certificatoMedico.tipo || ''}
                          onValueChange={(v) => updateAllegato('certificatoMedico', 'tipo', v)}
                        >
                          <SelectTrigger className={`h-7 text-xs ${allegati.certificatoMedico.tipo ? 'bg-green-100 border-green-300 text-green-900' : ''}`}>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="non_agonistico">Non Agonistico</SelectItem>
                            <SelectItem value="agonistico">Agonistico</SelectItem>
                            <SelectItem value="base">Base</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* RICEVUTE PAGAMENTI */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.ricevutePagamenti.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('ricevutePagamenti')}
                    data-testid="button-toggle-ricevute-pagamenti"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">RICEVUTE PAGAMENTI</span>
                      {allegati.ricevutePagamenti.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.ricevutePagamenti && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">N° Ricevute</Label>
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={allegati.ricevutePagamenti.numeroRicevute || 0}
                            onChange={(e) => updateAllegato('ricevutePagamenti', 'numeroRicevute', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Note</Label>
                          <Input
                            className="h-7 text-xs"
                            value={allegati.ricevutePagamenti.note || ''}
                            onChange={(e) => updateAllegato('ricevutePagamenti', 'note', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* MODELLO DETRAZIONE */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.modelloDetrazione.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('modelloDetrazione')}
                    data-testid="button-toggle-modello-detrazione"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">MODELLO DETRAZIONE</span>
                      {allegati.modelloDetrazione.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.modelloDetrazione && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Anno</Label>
                          <Input
                            className="h-7 text-xs"
                            value={allegati.modelloDetrazione.anno || ''}
                            onChange={(e) => updateAllegato('modelloDetrazione', 'anno', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Richiesto</Label>
                          <Select
                            value={allegati.modelloDetrazione.richiesto || ''}
                            onValueChange={(v) => updateAllegato('modelloDetrazione', 'richiesto', v)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Sì</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CREDITI SCOLASTICI */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.creditiScolastici.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('creditiScolastici')}
                    data-testid="button-toggle-crediti-scolastici"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">CREDITI SCOLASTICI</span>
                      {allegati.creditiScolastici.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.creditiScolastici && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Anno Scolastico</Label>
                          <Input
                            className="h-7 text-xs"
                            value={allegati.creditiScolastici.annoScolastico || ''}
                            onChange={(e) => updateAllegato('creditiScolastici', 'annoScolastico', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Richiesto</Label>
                          <Select
                            value={allegati.creditiScolastici.richiesto || ''}
                            onValueChange={(v) => updateAllegato('creditiScolastici', 'richiesto', v)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Sì</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TESSERINO TECNICO */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.tesserinoTecnico.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('tesserinoTecnico')}
                    data-testid="button-toggle-tesserino-tecnico"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">TESSERINO TECNICO</span>
                      {allegati.tesserinoTecnico.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.tesserinoTecnico && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Numero</Label>
                          <Input
                            className="h-7 text-xs"
                            placeholder="N° Tesserino"
                            value={allegati.tesserinoTecnico.numero || ''}
                            onChange={(e) => updateAllegato('tesserinoTecnico', 'numero', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data Rilascio</Label>
                          <Input
                            type="date"
                            className="h-7 text-xs"
                            value={allegati.tesserinoTecnico.dataRilascio || ''}
                            onChange={(e) => updateAllegato('tesserinoTecnico', 'dataRilascio', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TESSERA ENTE */}
                <div>
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.tesseraEnte.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('tesseraEnte')}
                    data-testid="button-toggle-tessera-ente"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">TESSERA ENTE</span>
                      {allegati.tesseraEnte.hasFile ? (
                        <Check className="w-4 h-4 text-success600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.tesseraEnte && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Numero</Label>
                          <Input
                            className="h-7 text-xs"
                            placeholder="N° Tessera"
                            value={allegati.tesseraEnte.numero || ''}
                            onChange={(e) => updateAllegato('tesseraEnte', 'numero', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Ente</Label>
                          <Input
                            className="h-7 text-xs"
                            placeholder="Ente"
                            value={allegati.tesseraEnte.ente || ''}
                            onChange={(e) => updateAllegato('tesseraEnte', 'ente', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
    </>
  );
}
