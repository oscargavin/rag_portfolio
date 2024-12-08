import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionRow = ({ onPromptClick }) => {
    const prompts = [
        "What was your post-graduate thesis on?",
        "What was your under-graduate thesis on?",
        "Have you ever worked on NLP tasks?",
        "What things interest you most?"
    ]
    return (
        <div className="prompt-suggestion-row">
            {prompts.map((prompt, index) =>
                <PromptSuggestionButton
                    key={`suggestion-${index}`}
                    text={prompt} onClick={() => onPromptClick(prompt)} />)}
        </div>
    )
}

export default PromptSuggestionRow