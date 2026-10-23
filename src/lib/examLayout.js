'use client';

import React, { useState, useMemo, useRef } from 'react';
import { buildLayout, resolveMode } from '@/lib/examLayout';

export default function ExamView({ exam, uid }) {
  // 1. Tính toán layout (blocks và order) dựa trên thuật toán của bạn
  // Dùng useMemo để tránh tính toán lại mỗi khi user chọn đáp án
  const layout = useMemo(() => buildLayout(exam, uid), [exam, uid]);
  const mode = resolveMode(exam);

  // State lưu trữ câu trả lời: { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const [answers, setAnswers] = useState({});

  // Xử lý khi học sinh chọn đáp án
  const handleSelectOption = (qi, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [qi]: optionId,
    }));
  };

  // Hàm format lại đoạn văn (giữ nguyên xuống dòng)
  const renderText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => (
      <span key={idx}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6">
      
      {/* CỘT TRÁI: ĐIỀU HƯỚNG CÂU HỎI */}
      <div className="w-full md:w-1/4">
        <div className="sticky top-4 bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-lg mb-3 border-b pb-2">Danh sách câu hỏi</h3>
          <div className="grid grid-cols-5 gap-2">
            {/* layout.order chứa mảng các chỉ số câu hỏi theo thứ tự hiển thị */}
            {layout.order.map((qi, index) => {
              const isAnswered = !!answers[qi];
              const displayNumber = index + 1;
              return (
                <a
                  key={qi}
                  href={`#question-${qi}`}
                  className={`flex items-center justify-center h-10 w-10 rounded font-medium text-sm transition-colors
                    ${isAnswered 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'}`}
                >
                  {displayNumber}
                </a>
              );
            })}
          </div>
          
          <button 
            onClick={() => alert('Đã nộp bài!')}
            className="mt-6 w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition"
          >
            Nộp bài
          </button>
        </div>
      </div>

      {/* CỘT PHẢI: NỘI DUNG BÀI THI */}
      <div className="w-full md:w-3/4">
        <div className="bg-white rounded-lg shadow border p-6">
          <h1 className="text-2xl font-bold mb-2">{exam.title || 'Bài thi trắc nghiệm'}</h1>
          <p className="text-gray-500 mb-6 italic">Chế độ hiển thị: {mode === 'paper' ? 'Đề giấy (Có bài đọc)' : 'Từng câu'}</p>

          <div className="space-y-8">
            {/* Lặp qua các khối (Blocks) */}
            {layout.blocks.map((block, bIdx) => (
              <div key={bIdx} className="border-t pt-6 first:border-0 first:pt-0">
                
                {/* 1. HIỂN THỊ BÀI ĐỌC / HƯỚNG DẪN (Nếu có) */}
                {(block.passage || block.instruction) && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                    {block.instruction && (
                      <p className="font-semibold text-blue-800 mb-2 italic">
                        {block.instruction}
                      </p>
                    )}
                    {block.passage && (
                      <div className="text-gray-800 leading-relaxed font-serif bg-white p-4 rounded shadow-sm border">
                        {renderText(block.passage)}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. HIỂN THỊ CÁC CÂU HỎI TRONG KHỐI */}
                <div className="space-y-6">
                  {block.items.map((item) => {
                    const q = exam.questions[item.qi];
                    // item.pos là thứ tự hiển thị (1, 2, 3...), item.qi là vị trí gốc
                    return (
                      <div key={item.qi} id={`question-${item.qi}`} className="scroll-mt-24">
                        <p className="font-medium text-gray-900 mb-3">
                          <span className="inline-block bg-gray-200 text-gray-700 rounded-full w-6 h-6 text-center leading-6 mr-2 text-sm">
                            {item.pos + 1}
                          </span>
                          {q.content}
                        </p>
                        
                        <div className="ml-8 space-y-2">
                          {q.options?.map((opt, oIdx) => {
                            const optLabel = String.fromCharCode(65 + oIdx); // A, B, C, D
                            const isSelected = answers[item.qi] === optLabel;
                            return (
                              <label 
                                key={oIdx} 
                                className={`flex items-center p-3 rounded-lg cursor-pointer border transition-colors
                                  ${isSelected ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50 border-transparent'}`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${item.qi}`}
                                  value={optLabel}
                                  checked={isSelected}
                                  onChange={() => handleSelectOption(item.qi, optLabel)}
                                  className="w-4 h-4 text-blue-600 mr-3 focus:ring-blue-500"
                                />
                                <span className="font-medium mr-2 text-gray-700">{optLabel}.</span>
                                <span className="text-gray-800">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}