import { create } from "zustand";

interface TaskwiseState {
  isModalOpen: boolean;
  currentFilter: string;
  setModalOpen: (isOpen: boolean) => void;
  setFilter: (filter: string) => void;
}

const useTaskwiseStore = create<TaskwiseState>((set) => ({
  isModalOpen: false,
  currentFilter: "All",
  setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  setFilter: (filter) => set({ currentFilter: filter }),
}));

export default useTaskwiseStore;
