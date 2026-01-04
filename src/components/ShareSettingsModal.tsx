import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Share2, Calendar, Infinity, Info } from 'lucide-react';
import { getShareConfig, setShareConfig, type ShareConfig } from '../db/db';
import type { Memory } from '../db/db';

interface ShareSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ShareConfig) => void;
  memories: Memory[];
}

export const ShareSettingsModal = ({ isOpen, onClose, onSave, memories }: ShareSettingsModalProps) => {
  const [mode, setMode] = useState<'unlimited' | 'range'>('unlimited');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 加载现有配置
  useEffect(() => {
    const loadConfig = async () => {
      if (isOpen) {
        const config = await getShareConfig();
        if (config) {
          setMode(config.mode);
          setStartDate(config.startDate || '');
          setEndDate(config.endDate || '');
        } else {
          setMode('unlimited');
          setStartDate('');
          setEndDate('');
        }
        setError('');
      }
    };
    loadConfig();
  }, [isOpen]);

  // 验证日期范围
  const validateDateRange = (): boolean => {
    if (mode === 'range') {
      if (!startDate || !endDate) {
        setError('请选择开始和结束日期');
        return false;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (start > end) {
        setError('开始日期不能晚于结束日期');
        return false;
      }

      if (end > today) {
        setError('结束日期不能晚于今日');
        return false;
      }

      // 检查所选日期区间内是否有照片
      const rangeStartDate = new Date(startDate);
      rangeStartDate.setHours(0, 0, 0, 0);
      const rangeEndDate = new Date(endDate);
      rangeEndDate.setHours(23, 59, 59, 999);

      const hasPhotosInRange = memories.some(memory => {
        const memoryDate = new Date(memory.date);
        return memoryDate >= rangeStartDate && memoryDate <= rangeEndDate;
      });

      if (!hasPhotosInRange) {
        setError(`所选日期区间（${rangeStartDate.toLocaleDateString('zh-CN')} 至 ${rangeEndDate.toLocaleDateString('zh-CN')}）内没有照片，请选择其他日期范围`);
        return false;
      }

      setError('');
      return true;
    }
    setError('');
    return true;
  };

  // 获取今日日期字符串（YYYY-MM-DD）
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 计算选定区间内的照片数量
  const getPhotosCountInRange = (): number => {
    if (mode !== 'range' || !startDate || !endDate) return 0;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return memories.filter(memory => {
      const memoryDate = new Date(memory.date);
      return memoryDate >= start && memoryDate <= end;
    }).length;
  };

  // 保存配置
  const handleSave = async () => {
    if (!validateDateRange()) {
      return;
    }

    setLoading(true);
    try {
      const config: Omit<ShareConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        mode,
        startDate: mode === 'range' ? startDate : undefined,
        endDate: mode === 'range' ? endDate : undefined
      };

      await setShareConfig(config);

      // 获取完整配置（包括自动生成的字段）
      const fullConfig = await getShareConfig();
      if (fullConfig) {
        onSave(fullConfig);
      }

      onClose();
    } catch (err) {
      console.error('保存分享配置失败:', err);
      setError('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card dark:glass-card-dark rounded-2xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Share2 size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">查看模式设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <div className="space-y-6">
            {/* 模式选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                选择查看模式
              </label>

              {/* 无限制模式 */}
              <div
                onClick={() => setMode('unlimited')}
                className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 mb-3 transform hover:scale-[1.02] ${
                  mode === 'unlimited'
                    ? 'border-primary-500 bg-gradient-soft dark:bg-primary-900/20 shadow-colored'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-soft'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 mt-1 p-2 rounded-lg ${
                    mode === 'unlimited' ? 'bg-gradient-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}>
                    <Infinity size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-bold ${
                        mode === 'unlimited' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        无限制模式
                      </h3>
                      {mode === 'unlimited' && (
                        <CheckCircle2 size={16} className="text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                      被分享者可以查看任意时间段的照片，分享后上传的新照片也会同步给被分享者
                    </p>
                  </div>
                </div>
              </div>

              {/* 区间模式 */}
              <div
                onClick={() => setMode('range')}
                className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  mode === 'range'
                    ? 'border-primary-500 bg-gradient-soft dark:bg-primary-900/20 shadow-colored'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-soft'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 mt-1 ${
                    mode === 'range' ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    <Calendar size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium ${
                        mode === 'range' ? 'text-blue-900' : 'text-gray-800'
                      }`}>
                        区间模式
                      </h3>
                      {mode === 'range' && (
                        <CheckCircle2 size={16} className="text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      只分享指定时间段内的照片，结束日期不能晚于今日
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 区间模式的日期选择 */}
            {mode === 'range' && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 animate-slide-down">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <Calendar size={18} className="mr-2 text-primary-500" />
                  设置日期范围
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 开始日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || getTodayDate()}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300"
                      required
                    />
                  </div>

                  {/* 结束日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      max={getTodayDate()}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* 日期范围提示 */}
                {startDate && endDate && (
                  <div className="mt-3 space-y-2">
                    <div className={`p-3 border rounded-md ${
                      getPhotosCountInRange() > 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <Info size={16} className={`flex-shrink-0 mt-0.5 ${
                          getPhotosCountInRange() > 0 ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            getPhotosCountInRange() > 0 ? 'text-green-800' : 'text-yellow-800'
                          }`}>
                            分享范围：{new Date(startDate).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}{' '}至{' '}
                            {new Date(endDate).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className={`text-sm mt-1 ${
                            getPhotosCountInRange() > 0 ? 'text-green-700' : 'text-yellow-700'
                          }`}>
                            该区间内有 <span className="font-bold">{getPhotosCountInRange()}</span> 条记忆
                            {getPhotosCountInRange() === 0 && '，无法保存空区间的配置'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* 说明信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">使用说明</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>设置后，通过分享链接访问的用户将根据此配置查看照片</li>
                <li>区间模式下，如果所选时间段内没有照片，用户将看到提示信息</li>
                <li>修改设置将立即生效，影响所有已有的分享链接</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading || (mode === 'range' && !!startDate && !!endDate && getPhotosCountInRange() === 0)}
            className="px-6 py-2.5 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg transition-all duration-300 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-colored hover:shadow-colored-lg transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>保存设置</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
