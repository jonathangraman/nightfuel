import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PhotoSearch from '../src/components/PhotoSearch';
import { findRecipePhotos } from '../src/lib/recipePhotos';
vi.mock('../src/lib/recipePhotos', () => ({findRecipePhotos:vi.fn()}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it('requires selecting a result and returns attribution without replacing recipe fields', async () => {
 const photo={title:'Noodles.jpg',imageUrl:'https://upload.wikimedia.org/noodles.jpg',imageSourceUrl:'https://commons.wikimedia.org/wiki/File:Noodles.jpg',imageCredit:'Jane',imageLicense:'CC0',imageIllustrative:true};
 findRecipePhotos.mockResolvedValue([photo]); const choose=vi.fn(); render(<PhotoSearch name="Lo mein" onChoose={choose}/>);
 fireEvent.click(screen.getByRole('button',{name:'Find a photo'})); await screen.findByRole('button',{name:'Use this photo'}); expect(choose).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Use this photo'})); expect(choose).toHaveBeenCalledWith(expect.objectContaining({imageCredit:'Jane',imageLicense:'CC0',imageIllustrative:true})); expect(choose.mock.calls[0][0].title).toBeUndefined();
});
it('explains when no licensed result is available', async()=>{ findRecipePhotos.mockResolvedValue([]); render(<PhotoSearch name="Some dish" onChoose={()=>{}}/>); fireEvent.click(screen.getByRole('button',{name:'Find a photo'})); expect(await screen.findByText(/No suitable licensed photos/)).toBeTruthy(); });
