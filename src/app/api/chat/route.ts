import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, isVIP } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '消息不能为空' },
        { status: 400 }
      );
    }

    // 构建系统提示词
    const systemPrompt = isVIP
      ? `你是用户的AI助手，VIP会员已激活。你具有以下特点：
1. 知识渊博，可以回答各类问题
2. 擅长写作，可以帮助用户撰写文章、邮件、文案等
3. 精通编程，可以写代码、调试程序、解释技术概念
4. 友好亲切，用中文与用户交流
5. 回答详细且有条理，没有长度限制
6. 可以处理复杂的多步骤任务

请根据用户的问题提供最有帮助的回答。`
      : `你是用户的AI助手。你具有以下特点：
1. 知识渊博，可以回答各类问题
2. 友好亲切，用中文与用户交流
3. 回答简洁明了

普通用户有使用限制，建议升级到VIP解锁全部功能。`;

    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...context.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // 调用平台内置LLM（SOLO）
    // 注意：这里使用模拟响应，实际部署时需要接入真实的AI API
    const response = await fetch('https://api.solo.io/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: isVIP ? 'gpt-4' : 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: isVIP ? 4096 : 1024,
      }),
    });

    if (!response.ok) {
      // 如果API调用失败，返回模拟响应（用于演示）
      const mockResponse = generateMockResponse(message, isVIP);
      return NextResponse.json({ response: mockResponse });
    }

    const data = await response.json();
    return NextResponse.json({ response: data.choices[0].message.content });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // 返回模拟响应（用于演示）
    const { message, isVIP } = await request.json().catch(() => ({ message: '', isVIP: false }));
    const mockResponse = generateMockResponse(message, isVIP);
    return NextResponse.json({ response: mockResponse });
  }
}

// 生成模拟响应（用于演示）
function generateMockResponse(message: string, isVIP: boolean): string {
  const responses = [
    `你好！我收到了你的消息："${message}"。

作为你的AI助手，我很乐意帮助你。${isVIP ? '作为VIP会员，你可以享受无限制的对话和更详细的回答。' : '升级到VIP可以解锁更多功能哦！'}

有什么具体的问题或任务需要我帮忙吗？比如：
- 写作辅助（文章、邮件、文案）
- 编程帮助（代码、调试、解释）
- 知识问答（百科、学习、研究）`,

    `感谢你的提问！关于"${message}"，我可以为你提供以下帮助：

${isVIP ? '【VIP专属】我可以为你提供详细的分析和多角度的解答。' : ''}

1. **详细解释**：我可以深入解释相关概念
2. **实用建议**：提供可操作的解决方案
3. **示例说明**：通过例子帮助你理解

请告诉我你更关注哪个方面？`,

    `收到！"${message}"

这是一个很有趣的话题。${isVIP ? '作为VIP会员，我会给你最全面、最专业的回答。' : ''}

让我来帮你：
- 梳理关键信息
- 提供专业见解
- 给出实用建议

你想从哪个角度开始了解呢？`,
  ];

  // 根据消息内容选择响应
  const index = message.length % responses.length;
  return responses[index];
}
