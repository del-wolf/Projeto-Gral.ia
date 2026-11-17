import { createDemoRepository } from './demo';
export const repository = createDemoRepository();
if (import.meta.env.MODE === 'demo' && typeof window !== 'undefined') {
 Object.defineProperty(window,'__graliaTest',{configurable:true,value:{repo:repository,reset:()=>repository.reset!()}});
}
