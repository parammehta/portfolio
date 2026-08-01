import { useState, type FormEvent, type ChangeEvent, type FocusEvent } from 'react';

type FormElement = HTMLInputElement | HTMLTextAreaElement;

interface FormInputReturn {
  value: string;
  error: string | null | undefined;
  onChange: (event: ChangeEvent<FormElement>) => void;
  onBlur: (event: FocusEvent<FormElement>) => void;
  onInvalid: (event: FormEvent<FormElement>) => void;
}

export function useFormInput(initialValue = ''): FormInputReturn {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>();
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (event: ChangeEvent<FormElement>) => {
    setValue(event.target.value);
    setIsDirty(true);

    // Resolve errors as soon as input becomes valid
    if (error && event.target.checkValidity()) {
      setError(null);
    }
  };

  const handleInvalid = (event: FormEvent<FormElement>) => {
    // Prevent native errors appearing
    event.preventDefault();
    setError((event.target as FormElement).validationMessage);
  };

  const handleBlur = (event: FocusEvent<FormElement>) => {
    // Only validate when the user has made a change
    if (isDirty) {
      event.target.checkValidity();
    }
  };

  return {
    value,
    error,
    onChange: handleChange,
    onBlur: handleBlur,
    onInvalid: handleInvalid,
  };
}
