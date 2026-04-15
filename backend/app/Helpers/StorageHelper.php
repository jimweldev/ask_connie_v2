<?php

namespace App\Helpers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\Element\Text;
use PhpOffice\PhpWord\Element\TextRun;
use Smalot\PdfParser\Parser as PdfParser;

class StorageHelper {
    public static function uploadFile(UploadedFile $file, $folder = 'default', $isPrivate = false) {
        $basePath = 'ask_connie';
        $directory = $basePath.'/'.$folder;

        try {
            $fileName = Str::uuid().'.'.$file->getClientOriginalExtension();

            $storedPath = Storage::disk('s3')->putFileAs(
                $directory,
                $file,
                $fileName,
                [
                    'visibility' => $isPrivate ? 'private' : 'public',
                ]
            );

            if ($storedPath) {
                return '/'.$directory.'/'.$fileName;
            }

            return false;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Delete a file from storage
     * 
     * @param string $filePath The path of the file to delete (e.g., '/ask_connie/avatars/uuid.jpg')
     * @return bool True if deleted successfully, false otherwise
     */
    public static function deleteFile($filePath) {
        if (empty($filePath)) {
            return false;
        }

        try {
            // Remove leading slash if present
            $path = ltrim($filePath, '/');
            
            // Check if file exists before deleting
            if (Storage::disk('s3')->exists($path)) {
                return Storage::disk('s3')->delete($path);
            }
            
            return false;
        } catch (\Throwable $e) {
            return false;
        }
    }

    public static function extractFileContent($filePath) {
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        $disk = Storage::disk('s3');

        switch (strtolower($extension)) {
            case 'txt':
                return $disk->get($filePath);
            case 'pdf':
                $pdfParser = new PdfParser;
                $tempPath = tempnam(sys_get_temp_dir(), 'pdf_');
                file_put_contents($tempPath, $disk->get($filePath));
                $pdf = $pdfParser->parseFile($tempPath);
                unlink($tempPath);

                return $pdf->getText();
            case 'docx':
                $tempPath = tempnam(sys_get_temp_dir(), 'docx_');
                file_put_contents($tempPath, $disk->get($filePath));

                $phpWord = \PhpOffice\PhpWord\IOFactory::load($tempPath);
                unlink($tempPath);

                $text = '';

                foreach ($phpWord->getSections() as $section) {
                    foreach ($section->getElements() as $element) {
                        // Handle plain Text elements
                        if ($element instanceof \PhpOffice\PhpWord\Element\Text) {
                            $text .= $element->getText()."\n";
                        }

                        // Handle TextRun (very common in DOCX)
                        elseif ($element instanceof \PhpOffice\PhpWord\Element\TextRun) {
                            foreach ($element->getElements() as $child) {
                                if ($child instanceof \PhpOffice\PhpWord\Element\Text) {
                                    $text .= $child->getText();
                                }
                            }
                            $text .= "\n";
                        }

                        // Handle Tables (optional but useful)
                        elseif ($element instanceof \PhpOffice\PhpWord\Element\Table) {
                            foreach ($element->getRows() as $row) {
                                foreach ($row->getCells() as $cell) {
                                    foreach ($cell->getElements() as $cellElement) {
                                        if ($cellElement instanceof \PhpOffice\PhpWord\Element\Text) {
                                            $text .= $cellElement->getText().' ';
                                        }
                                    }
                                }
                                $text .= "\n";
                            }
                        }
                    }
                }

                return trim($text);
            default:
                return null;
        }
    }
}
