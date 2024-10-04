import { Timestamp } from 'firebase/firestore';

export interface Activity {
    type: string;
    timestamp: Timestamp;
}

export interface Settings {
  longBreak: number;
  shortBreak: number;
  defaultTimeLength: number;
  activityCategories: {
  name: string;
  color: string;
  }[];
}

export const defaultCategories = [
    {
        name: 'Work',
        color: '#8D8D8D'
    },
    {
        name: 'Long Break',
        color: '#00FFFF'
    },
    {
        name: 'Short Break',
        color: '#89CFF0'
    }
]
  

export const defaultSettings: Settings = {
    longBreak: 15,
    shortBreak: 5,
    defaultTimeLength: 25,
    activityCategories: defaultCategories,
  };