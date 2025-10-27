'use client';

import { useState, useRef, useEffect } from 'react';

interface WordData {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  mnemonic: string;
  isLearned: boolean;
  isFavorited: boolean;
  isMastered: boolean;
}

type ViewState = 'word' | 'details' | 'status';

export default function Home() {
  const [wordsData, setWordsData] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewState, setViewState] = useState<ViewState>('word');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [learnFavorites, setLearnFavorites] = useState(true); // 控制是否学习收藏的单词
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFileContent = (content: string): WordData[] => {
    const lines = content.trim().split('\n');
    return lines.map(line => {
      const parts = line.split('|');
      return {
        word: parts[0] || '',
        phonetic: parts[1] || '',
        partOfSpeech: parts[2] || '',
        meaning: parts[3] || '',
        mnemonic: parts[4] || '',
        isLearned: parts[5] === '1',
        isFavorited: parts[6] === '1',
        isMastered: parts[7] === '1'
      };
    });
  };

  // 判断单词是否应该在循环中显示
  const shouldShowInLoop = (word: WordData): boolean => {
    // 如果熟记了，不显示
    if (word.isMastered) {
      return false;
    }
    
    // 未学会的单词总是要显示
    if (!word.isLearned) {
      return true;
    }
    
    // 已学会但收藏的单词，根据学习收藏设置决定是否显示
    if (word.isFavorited && word.isLearned) {
      return learnFavorites;
    }
    
    // 其他情况不显示
    return false;
  };

  // 编辑字段
  const handleFieldEdit = (field: keyof WordData) => {
    if (wordsData.length === 0) return;
    
    const currentValue = currentWord[field] as string;
    const newValue = prompt(`编辑${getFieldLabel(field)}:`, currentValue);
    
    if (newValue !== null && newValue !== currentValue) {
      setWordsData(prevWordsData => {
        const updatedWords = [...prevWordsData];
        updatedWords[currentIndex] = {
          ...updatedWords[currentIndex],
          [field]: newValue
        };
        return updatedWords;
      });
    }
  };

  // 获取字段标签
  const getFieldLabel = (field: keyof WordData): string => {
    const labels = {
      word: '单词',
      phonetic: '音标',
      partOfSpeech: '词性',
      meaning: '含义',
      mnemonic: '助记'
    };
    return labels[field as keyof typeof labels] || field;
  };

  // 生成下载文件内容
  const generateFileContent = (): string => {
    return wordsData.map(word => {
      return [
        word.word,
        word.phonetic,
        word.partOfSpeech,
        word.meaning,
        word.mnemonic,
        word.isLearned ? '1' : '0',
        word.isFavorited ? '1' : '0',
        word.isMastered ? '1' : '0'
      ].join('|');
    }).join('\n');
  };

  // 生成文件名
  const generateFileName = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const dateTime = `${year}${month}${day}_${hours}${minutes}${seconds}`;
    const currentWordIndex = currentIndex + 1;
    
    return `words_${currentWordIndex}_${dateTime}.txt`;
  };

  // 下载文件
  const handleDownload = () => {
    if (wordsData.length === 0) {
      alert('没有数据可以下载');
      return;
    }

    const content = generateFileContent();
    const fileName = generateFileName();
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  // 跳转功能
  const handleJump = () => {
    if (wordsData.length === 0) {
      alert('请先上传单词文件');
      return;
    }

    const input = prompt(`请输入要跳转的单词索引 (1-${wordsData.length}):`);
    
    if (input === null) {
      // 用户取消了输入
      return;
    }

    const targetIndex = parseInt(input.trim());
    
    if (isNaN(targetIndex)) {
      alert('请输入有效的数字');
      return;
    }

    if (targetIndex < 1 || targetIndex > wordsData.length) {
      alert(`索引必须在 1 到 ${wordsData.length} 之间`);
      return;
    }

    // 跳转到指定索引（转换为0基础索引）
    setCurrentIndex(targetIndex - 1);
    setViewState('word');
  };

  // 切换收藏状态
  const toggleFavoriteStatus = () => {
    if (wordsData.length > 0) {
      setWordsData(prevWordsData => {
        const updatedWords = [...prevWordsData];
        updatedWords[currentIndex] = {
          ...updatedWords[currentIndex],
          isFavorited: !updatedWords[currentIndex].isFavorited
        };
        return updatedWords;
      });
    }
  };

  // 切换熟记状态
  const toggleMasteredStatus = () => {
    if (wordsData.length > 0) {
      setWordsData(prevWordsData => {
        const updatedWords = [...prevWordsData];
        updatedWords[currentIndex] = {
          ...updatedWords[currentIndex],
          isMastered: !updatedWords[currentIndex].isMastered
        };
        return updatedWords;
      });
    }
  };

  // 切换学习收藏状态
  const toggleLearnFavorites = () => {
    setLearnFavorites(!learnFavorites);
  };

  // 寻找下一个应该显示的单词索引
  const findNextDisplayableIndex = (startIndex: number): number => {
    for (let i = 1; i <= wordsData.length; i++) {
      const nextIndex = (startIndex + i) % wordsData.length;
      if (shouldShowInLoop(wordsData[nextIndex])) {
        return nextIndex;
      }
    }
    return startIndex; // 如果没有符合条件的单词，返回当前索引
  };

  // 寻找上一个应该显示的单词索引
  const findPrevDisplayableIndex = (startIndex: number): number => {
    for (let i = 1; i <= wordsData.length; i++) {
      const prevIndex = (startIndex - i + wordsData.length) % wordsData.length;
      if (shouldShowInLoop(wordsData[prevIndex])) {
        return prevIndex;
      }
    }
    return startIndex; // 如果没有符合条件的单词，返回当前索引
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // 删除文件中的所有制表符
        const contentWithoutTabs = content.replace(/\t/g, '');
        const parsed = parseFileContent(contentWithoutTabs);
        setWordsData(parsed);
        // 找到第一个应该显示的单词
        const firstDisplayableIndex = parsed.findIndex(word => shouldShowInLoop(word));
        setCurrentIndex(firstDisplayableIndex >= 0 ? firstDisplayableIndex : 0);
        setViewState('word');
      };
      reader.readAsText(file);
    }
  };

  const handleRightArrow = () => {
    if (viewState === 'word') {
      setViewState('details');
    } else if (viewState === 'details') {
      setViewState('status');
    } else if (viewState === 'status') {
      // 切换到下一个应该显示的单词
      const nextIndex = findNextDisplayableIndex(currentIndex);
      setCurrentIndex(nextIndex);
      setViewState('word');
    }
  };

  const handleLeftArrow = () => {
    if (viewState === 'status') {
      setViewState('details');
    } else if (viewState === 'details') {
      setViewState('word');
    } else if (viewState === 'word') {
      // 切换到上一个应该显示的单词的状态三
      const prevIndex = findPrevDisplayableIndex(currentIndex);
      setCurrentIndex(prevIndex);
      setViewState('status');
    }
  };

  const toggleLearnedStatus = () => {
    if (viewState === 'status' && wordsData.length > 0) {
      setWordsData(prevWordsData => {
        const updatedWords = [...prevWordsData];
        updatedWords[currentIndex] = {
          ...updatedWords[currentIndex],
          isLearned: !updatedWords[currentIndex].isLearned
        };
        return updatedWords;
      });
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        handleRightArrow();
      } else if (event.key === 'ArrowLeft') {
        handleLeftArrow();
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // 在status状态下，上下键切换学习状态
        toggleLearnedStatus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [viewState, currentIndex, wordsData]);

  const currentWord = wordsData[currentIndex];
  const displayableCount = wordsData.filter(word => shouldShowInLoop(word)).length;

  const renderTable = () => {
    if (!currentWord) return null;

    if (viewState === 'word') {
      // 状态一：只显示单词
      return (
        <table className="border-2 border-gray-300 bg-white rounded">
          <tbody>
            <tr>
              <td className="px-20 py-16 text-center border border-gray-300 text-9xl font-bold">
                {currentWord.word}
              </td>
            </tr>
          </tbody>
        </table>
      );
    } else if (viewState === 'details') {
      // 状态二：显示详细信息（可编辑的前四行）
      return (
        <table className="border-2 border-gray-300 bg-white rounded">
          <tbody>
            <tr>
              <td 
                className="px-6 py-4 text-center border border-gray-300 text-3xl cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleFieldEdit('phonetic')}
                title="点击编辑音标"
              >
                {currentWord.phonetic || '点击添加音标'}
              </td>
            </tr>
            <tr>
              <td 
                className="px-6 py-4 text-center border border-gray-300 text-3xl cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleFieldEdit('partOfSpeech')}
                title="点击编辑词性"
              >
                {currentWord.partOfSpeech || '点击添加词性'}
              </td>
            </tr>
            <tr>
              <td 
                className="px-6 py-4 text-center border border-gray-300 text-8xl font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleFieldEdit('meaning')}
                title="点击编辑含义"
              >
                {currentWord.meaning || '点击添加含义'}
              </td>
            </tr>
            <tr>
              <td 
                className="px-6 py-4 text-center border border-gray-300 cursor-pointer text-3xl hover:bg-gray-100 transition-colors"
                onClick={() => handleFieldEdit('mnemonic')}
                title="点击编辑助记"
              >
                {currentWord.mnemonic || '点击添加助记'}
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-center border border-gray-300">
                联想：
              </td>
            </tr>
          </tbody>
        </table>
      );
    } else {
      // 状态三：显示是否记住状态
      return (
        <table className="border-2 border-gray-300 bg-white rounded">
          <tbody>
            <tr>
              <td className={`px-20 py-16 text-center border border-gray-300 text-6xl font-bold ${
                currentWord.isLearned ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentWord.isLearned ? '1' : '0'}
              </td>
            </tr>
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt"
        className="hidden"
      />

      {/* 顶部区域 - 进度和按钮 */}
      <div className="flex justify-between items-center pt-2 px-4">
        {/* 左侧空白 */}
        <div className="flex-1"></div>
        
        {/* 中间进度区域 */}
        <div className="text-center text-3xl font-bold text-gray-700">
          {wordsData.length > 0 ? (
            <>
              {`${currentIndex + 1}/${wordsData.length} (${wordsData.slice(0, currentIndex + 1).filter(w => !w.isLearned).length}/${wordsData.filter(w => !w.isLearned).length})`}
            </>
          ) : '0/0'}
        </div>
        
        {/* 右侧按钮组 */}
        <div className="flex-1 flex justify-end gap-2">
          {wordsData.length > 0 && currentWord && (
            <>
              <button
                onClick={toggleLearnFavorites}
                className={`px-2 py-1 rounded text-3xl shadow transition-colors ${
                  learnFavorites
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {learnFavorites ? '学习收藏' : '不学收藏'}
              </button>
              <button
                onClick={toggleFavoriteStatus}
                className={`px-2 py-1 rounded text-3xl shadow transition-colors ${
                  currentWord.isFavorited
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {currentWord.isFavorited ? '已收藏' : '未收藏'}
              </button>
              <button
                onClick={toggleMasteredStatus}
                className={`px-2 py-1 rounded text-3xl shadow transition-colors ${
                  currentWord.isMastered
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {currentWord.isMastered ? '已熟记' : '未熟记'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* 表格区域 */}
      <div className="flex-1 flex items-center justify-center">
        {wordsData.length > 0 ? (
          displayableCount > 0 ? (
            renderTable()
          ) : (
            <div className="text-green-500 text-lg">🎉 所有单词都已完成学习！</div>
          )
        ) : (
          <div className="text-gray-500 text-lg">请上传单词文件</div>
        )}
      </div>

      {/* 右下角按钮组 */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm shadow transition-colors"
        >
          上传
        </button>
        <button 
          onClick={handleDownload}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm shadow transition-colors"
        >
          下载
        </button>
        <button 
          onClick={handleJump}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm shadow transition-colors"
        >
          跳转
        </button>
      </div>
    </div>
  );
}
